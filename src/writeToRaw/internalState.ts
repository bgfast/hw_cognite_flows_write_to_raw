/**
 * The host serializes this into the URL, so it survives a reload and travels
 * with a shared link. Only UI state belongs here.
 */
export type WriteToRawInternalState = {
  resultsOpen: boolean;
};

const DEFAULT_INTERNAL_STATE: WriteToRawInternalState = { resultsOpen: false };

export function parseInternalState(raw: string | undefined): WriteToRawInternalState {
  if (!raw) return DEFAULT_INTERNAL_STATE;

  try {
    const parsed: unknown = JSON.parse(raw);

    return isInternalState(parsed) ? parsed : DEFAULT_INTERNAL_STATE;
  } catch {
    return DEFAULT_INTERNAL_STATE;
  }
}

export function serializeInternalState(state: WriteToRawInternalState): string {
  return JSON.stringify(state);
}

function isInternalState(value: unknown): value is WriteToRawInternalState {
  if (typeof value !== 'object' || value === null) return false;
  if (!('resultsOpen' in value)) return false;

  return typeof value.resultsOpen === 'boolean';
}
