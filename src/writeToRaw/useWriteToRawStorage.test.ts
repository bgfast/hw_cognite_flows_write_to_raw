import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useWriteToRawStorage } from './useWriteToRawStorage';

describe(useWriteToRawStorage.name, () => {
  it('starts idle with the results panel closed', () => {
    const { result } = renderHook(() => useWriteToRawStorage(false));

    expect(result.current.state).toEqual({
      status: 'idle',
      writtenCount: 0,
      errorMessage: null,
      rowsFromRaw: null,
      isReadingRows: false,
      isResultsOpen: false,
    });
  });

  it('seeds the results panel from the restored host state', () => {
    const { result } = renderHook(() => useWriteToRawStorage(true));

    expect(result.current.state.isResultsOpen).toBe(true);
  });

  it('merges a patch into the existing state', () => {
    const { result } = renderHook(() => useWriteToRawStorage(false));

    act(() => {
      result.current.update({ status: 'success', writtenCount: 5 });
    });

    expect(result.current.state.status).toBe('success');
    expect(result.current.state.writtenCount).toBe(5);
    expect(result.current.state.errorMessage).toBeNull();
  });
});
