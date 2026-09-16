import { createContext, useCallback, useContext, useEffect, useRef } from 'react';

import { parseInternalState, serializeInternalState } from './internalState';
import { toReadErrorMessage, toWriteErrorMessage } from './rawErrors';
import { RAW_EXPLORER_PATH, buildRawExplorerQuery } from './rawExplorerLink';
import { VERIFY_ROW_LIMIT } from './rawSampleService';
import type { RawRowRead, RawSampleService } from './rawSampleService';
import { RAW_DATABASE_NAME, RAW_TABLE_NAME, SAMPLE_COLUMNS, SAMPLE_ROWS } from './sampleData';
import type { SampleColumn, SampleRow } from './sampleData';
import { useWriteToRawStorage } from './useWriteToRawStorage';
import type { WriteStatus } from './useWriteToRawStorage';

/** The slice of `HostAppAPI` this view model needs. */
export type WriteToRawHost = {
  syncInternalState: (state: string) => Promise<boolean>;
  navigateInternal: (options: {
    path: string;
    queryParams?: Record<string, string>;
    openInNewTab?: boolean;
  }) => Promise<boolean>;
};

const defaultDeps = { useWriteToRawStorage };

export type WriteToRawViewModelContextType = typeof defaultDeps;

export const WriteToRawViewModelContext =
  createContext<WriteToRawViewModelContextType>(defaultDeps);

export type WriteToRawViewModelProps = {
  service: RawSampleService;
  host: WriteToRawHost | null;
  initialState?: string;
};

export type WriteToRawViewModel = {
  databaseName: string;
  tableName: string;
  columns: readonly SampleColumn[];
  rowsToWrite: SampleRow[];
  status: WriteStatus;
  isWriting: boolean;
  writtenCount: number;
  errorMessage: string | null;
  rowsFromRaw: RawRowRead[] | null;
  isReadingRows: boolean;
  isResultsOpen: boolean;
  canOpenRawExplorer: boolean;
  write: () => Promise<void>;
  toggleResults: () => Promise<void>;
  openRawExplorer: () => Promise<void>;
};

export function useWriteToRawViewModel({
  service,
  host,
  initialState,
}: WriteToRawViewModelProps): WriteToRawViewModel {
  const { useWriteToRawStorage } = useContext(WriteToRawViewModelContext);
  const restoredResultsOpen = parseInternalState(initialState).resultsOpen;
  const { state, update } = useWriteToRawStorage(restoredResultsOpen);

  const readRows = useCallback(async () => {
    update({ isReadingRows: true });
    try {
      const rows = await service.readSampleRows(VERIFY_ROW_LIMIT);
      update({ rowsFromRaw: rows, isReadingRows: false });
    } catch (error) {
      update({ errorMessage: toReadErrorMessage(error), isReadingRows: false });
    }
  }, [service, update]);

  const isResultsOpen = state.isResultsOpen;

  const write = useCallback(async () => {
    update({ status: 'writing', errorMessage: null });
    try {
      const writtenCount = await service.writeSampleRows();
      update({ status: 'success', writtenCount });
      if (isResultsOpen) await readRows();
    } catch (error) {
      update({ status: 'error', errorMessage: toWriteErrorMessage(error) });
    }
  }, [service, update, isResultsOpen, readRows]);

  const toggleResults = useCallback(async () => {
    const resultsOpen = !isResultsOpen;
    update({ isResultsOpen: resultsOpen });
    await host?.syncInternalState(serializeInternalState({ resultsOpen }));
    if (resultsOpen) await readRows();
  }, [isResultsOpen, update, host, readRows]);

  // The host resolves organisation, project, cluster, and workspace, so this
  // link follows whichever CDF the app is running in.
  const openRawExplorer = useCallback(async () => {
    await host?.navigateInternal({
      path: RAW_EXPLORER_PATH,
      queryParams: buildRawExplorerQuery(RAW_DATABASE_NAME, RAW_TABLE_NAME),
      openInNewTab: true,
    });
  }, [host]);

  // A restored open panel should show live rows, not an empty shell. Guarded so
  // it runs once on mount and never competes with `toggleResults`.
  const hasRestored = useRef(false);
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    if (restoredResultsOpen) void readRows();
  }, [restoredResultsOpen, readRows]);

  return {
    databaseName: RAW_DATABASE_NAME,
    tableName: RAW_TABLE_NAME,
    columns: SAMPLE_COLUMNS,
    rowsToWrite: SAMPLE_ROWS,
    status: state.status,
    isWriting: state.status === 'writing',
    writtenCount: state.writtenCount,
    errorMessage: state.errorMessage,
    rowsFromRaw: state.rowsFromRaw,
    isReadingRows: state.isReadingRows,
    isResultsOpen,
    canOpenRawExplorer: host !== null,
    write,
    toggleResults,
    openRawExplorer,
  };
}
