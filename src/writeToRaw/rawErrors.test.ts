import { describe, expect, it } from 'vitest';

import { toReadErrorMessage, toWriteErrorMessage } from './rawErrors';

describe(toWriteErrorMessage.name, () => {
  it('names the missing capability when CDF returns 403', () => {
    const message = toWriteErrorMessage({ status: 403, message: 'Forbidden' });

    expect(message).toContain('rawAcl:WRITE');
  });

  it('surfaces the underlying message for other failures', () => {
    const message = toWriteErrorMessage(new Error('Service unavailable'));

    expect(message).toContain('Service unavailable');
  });

  it('stays readable when the failure carries no message', () => {
    expect(toWriteErrorMessage(undefined)).toBe(
      'Could not write the sample rows to CDF RAW. Please try again.'
    );
  });
});

describe(toReadErrorMessage.name, () => {
  it('names the missing capability when CDF returns 403', () => {
    const message = toReadErrorMessage({ status: 403 });

    expect(message).toContain('rawAcl:READ');
  });

  it('surfaces the underlying message for other failures', () => {
    const message = toReadErrorMessage(new Error('Gateway timeout'));

    expect(message).toContain('Gateway timeout');
  });

  it('stays readable when the failure carries no message', () => {
    expect(toReadErrorMessage(null)).toBe(
      'Could not read the rows back from CDF RAW. Please try again.'
    );
  });
});
