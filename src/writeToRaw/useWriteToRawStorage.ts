import { useCallback, useState } from 'react';

import type { RawRowRead } from './rawSampleService';

export type WriteStatus = 'idle' | 'writing' | 'success' | 'error';

export type WriteToRawState = {
  status: WriteStatus;
  writtenCount: number;
  errorMessage: string | null;
  /** `null` until a verification read has completed at least once. */
  rowsFromRaw: RawRowRead[] | null;
  isReadingRows: boolean;
  isResultsOpen: boolean;
};

export type WriteToRawStorage = {
  state: WriteToRawState;
  update: (patch: Partial<WriteToRawState>) => void;
};

/**
 * The shared storage layer for the write screen. The view model composes this
 * with commands and derivations, and never holds state of its own.
 */
export function useWriteToRawStorage(initialResultsOpen: boolean): WriteToRawStorage {
  const [state, setState] = useState<WriteToRawState>({
    status: 'idle',
    writtenCount: 0,
    errorMessage: null,
    rowsFromRaw: null,
    isReadingRows: false,
    isResultsOpen: initialResultsOpen,
  });

  const update = useCallback((patch: Partial<WriteToRawState>) => {
    setState((previous) => ({ ...previous, ...patch }));
  }, []);

  return { state, update };
}
