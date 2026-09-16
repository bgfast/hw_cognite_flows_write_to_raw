import { describe, expect, it } from 'vitest';

import { parseInternalState, serializeInternalState } from './internalState';

describe(parseInternalState.name, () => {
  it('defaults to a closed results panel when the host supplies nothing', () => {
    expect(parseInternalState(undefined)).toEqual({ resultsOpen: false });
  });

  it('restores an open results panel', () => {
    expect(parseInternalState('{"resultsOpen":true}')).toEqual({ resultsOpen: true });
  });

  it('falls back to the default when the host state is not valid JSON', () => {
    expect(parseInternalState('not json')).toEqual({ resultsOpen: false });
  });

  it('falls back to the default when the host state has the wrong shape', () => {
    expect(parseInternalState('{"resultsOpen":"yes"}')).toEqual({ resultsOpen: false });
    expect(parseInternalState('null')).toEqual({ resultsOpen: false });
    expect(parseInternalState('{}')).toEqual({ resultsOpen: false });
  });
});

describe(serializeInternalState.name, () => {
  it('round-trips through the parser', () => {
    const serialized = serializeInternalState({ resultsOpen: true });

    expect(parseInternalState(serialized)).toEqual({ resultsOpen: true });
  });
});
