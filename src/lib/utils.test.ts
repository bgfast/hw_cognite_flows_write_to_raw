import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe(cn.name, () => {
  it('joins class names', () => {
    expect(cn('p-2', 'text-sm')).toBe('p-2 text-sm');
  });

  it('drops falsy values', () => {
    expect(cn('p-2', false, undefined, null)).toBe('p-2');
  });

  it('lets a later Tailwind class win over an earlier conflicting one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
