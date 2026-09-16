const FORBIDDEN = 403;

export function toWriteErrorMessage(error: unknown): string {
  if (statusOf(error) === FORBIDDEN) {
    return 'Writing to CDF RAW needs the rawAcl:WRITE capability. Ask your CDF admin to grant it, then try again.';
  }

  const detail = messageOf(error);

  return detail
    ? `Could not write the sample rows to CDF RAW: ${detail}`
    : 'Could not write the sample rows to CDF RAW. Please try again.';
}

export function toReadErrorMessage(error: unknown): string {
  if (statusOf(error) === FORBIDDEN) {
    return 'Reading the rows back needs the rawAcl:READ capability. Ask your CDF admin to grant it, then try again.';
  }

  const detail = messageOf(error);

  return detail
    ? `Could not read the rows back from CDF RAW: ${detail}`
    : 'Could not read the rows back from CDF RAW. Please try again.';
}

function statusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null;
  if (!('status' in error)) return null;

  return typeof error.status === 'number' ? error.status : null;
}

function messageOf(error: unknown): string | null {
  if (error instanceof Error) return error.message;
  if (typeof error !== 'object' || error === null) return null;
  if (!('message' in error)) return null;

  return typeof error.message === 'string' ? error.message : null;
}
