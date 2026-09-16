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

  it('reads the message off a plain CDF error object', () => {
    const message = toWriteErrorMessage({ status: 500, message: 'Internal server error' });

    expect(message).toContain('Internal server error');
  });

  it('stays readable when the failure carries no message', () => {
    expect(toWriteErrorMessage(undefined)).toBe(
      'Could not write the sample rows to CDF RAW. Please try again.'
    );
    expect(toWriteErrorMessage({ status: 500 })).toBe(
      'Could not write the sample rows to CDF RAW. Please try again.'
    );
    expect(toWriteErrorMessage({ message: 42 })).toBe(
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
