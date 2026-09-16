import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VERIFY_ROW_LIMIT } from './rawSampleService';
import type { RawSampleService } from './rawSampleService';
import { SAMPLE_ROWS } from './sampleData';
import { useWriteToRawStorage } from './useWriteToRawStorage';
import {
  WriteToRawViewModelContext,
  useWriteToRawViewModel,
} from './useWriteToRawViewModel';
import type { WriteToRawViewModelContextType , WriteToRawHost } from './useWriteToRawViewModel';

describe(useWriteToRawViewModel.name, () => {
  let context: WriteToRawViewModelContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    context = { useWriteToRawStorage };
    wrapper = ({ children }) => (
      <WriteToRawViewModelContext.Provider value={context}>
        {children}
      </WriteToRawViewModelContext.Provider>
    );
  });

  it('exposes the fixed rows and starts idle', () => {
    const { result } = renderHook(() => useWriteToRawViewModel(makeProps()), { wrapper });

    expect(result.current.rowsToWrite).toEqual(SAMPLE_ROWS);
    expect(result.current.status).toBe('idle');
    expect(result.current.isWriting).toBe(false);
  });

  it('reports the written row count on success', async () => {
    const service = makeService();
    const { result } = renderHook(() => useWriteToRawViewModel(makeProps({ service })), {
      wrapper,
    });

    await act(async () => {
      await result.current.write();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.writtenCount).toBe(SAMPLE_ROWS.length);
    expect(result.current.errorMessage).toBeNull();
  });

  it('is writing while the request is in flight', async () => {
    let resolveWrite: (count: number) => void = () => undefined;
    const service = makeService({
      writeSampleRows: vi.fn(() => new Promise<number>((resolve) => (resolveWrite = resolve))),
    });
    const { result } = renderHook(() => useWriteToRawViewModel(makeProps({ service })), {
      wrapper,
    });

    act(() => {
      void result.current.write();
    });
    await waitFor(() => expect(result.current.isWriting).toBe(true));

    await act(async () => {
      resolveWrite(SAMPLE_ROWS.length);
    });
    await waitFor(() => expect(result.current.isWriting).toBe(false));
  });

  it('surfaces a capability error when the write is forbidden', async () => {
    const service = makeService({
      writeSampleRows: vi.fn(() => Promise.reject({ status: 403 })),
    });
    const { result } = renderHook(() => useWriteToRawViewModel(makeProps({ service })), {
      wrapper,
    });

    await act(async () => {
      await result.current.write();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toContain('rawAcl:WRITE');
  });

  it('reads rows back and syncs the panel to the host when opened', async () => {
    const service = makeService();
    const host = makeHost();
    const { result } = renderHook(() => useWriteToRawViewModel(makeProps({ service, host })), {
      wrapper,
    });

    await act(async () => {
      await result.current.toggleResults();
    });

    expect(host.syncInternalState).toHaveBeenCalledWith('{"resultsOpen":true}');
    expect(service.readSampleRows).toHaveBeenCalledWith(VERIFY_ROW_LIMIT);
    expect(result.current.rowsFromRaw).toEqual([{ key: 'pump-101', columns: { name: 'A' } }]);
  });

  it('reads rows back on load when the host restored an open panel', async () => {
    const service = makeService();
    const { result } = renderHook(
      () => useWriteToRawViewModel(makeProps({ service, initialState: '{"resultsOpen":true}' })),
      { wrapper }
    );

    await waitFor(() => expect(service.readSampleRows).toHaveBeenCalledTimes(1));
    expect(result.current.isResultsOpen).toBe(true);
  });

  it('surfaces a capability error when the read is forbidden', async () => {
    const service = makeService({
      readSampleRows: vi.fn(() => Promise.reject({ status: 403 })),
    });
    const { result } = renderHook(() => useWriteToRawViewModel(makeProps({ service })), {
      wrapper,
    });

    await act(async () => {
      await result.current.toggleResults();
    });

    expect(result.current.errorMessage).toContain('rawAcl:READ');
  });

  it('refreshes the rows after a write while the panel is open', async () => {
    const service = makeService();
    const { result } = renderHook(
      () => useWriteToRawViewModel(makeProps({ service, initialState: '{"resultsOpen":true}' })),
      { wrapper }
    );
    await waitFor(() => expect(service.readSampleRows).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.write();
    });

    expect(service.readSampleRows).toHaveBeenCalledTimes(2);
  });
});

function makeService(overrides: Partial<RawSampleService> = {}): RawSampleService {
  return {
    writeSampleRows: vi.fn(() => Promise.resolve(SAMPLE_ROWS.length)),
    readSampleRows: vi.fn(() => Promise.resolve([{ key: 'pump-101', columns: { name: 'A' } }])),
    ...overrides,
  };
}

function makeHost(): WriteToRawHost {
  return { syncInternalState: vi.fn(() => Promise.resolve(true)) };
}

function makeProps(
  overrides: {
    service?: RawSampleService;
    host?: WriteToRawHost | null;
    initialState?: string;
  } = {}
) {
  return {
    service: overrides.service ?? makeService(),
    host: overrides.host ?? null,
    initialState: overrides.initialState,
  };
}
