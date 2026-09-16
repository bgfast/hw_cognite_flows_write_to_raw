import { describe, expect, it } from 'vitest';

import { RAW_DATABASE_NAME, RAW_TABLE_NAME, SAMPLE_COLUMNS, SAMPLE_ROWS } from './sampleData';

describe('sampleData', () => {
  it('targets the database and table documented in SPEC.md', () => {
    expect(RAW_DATABASE_NAME).toBe('raw_sample_all_flows');
    expect(RAW_TABLE_NAME).toBe('hello_world');
  });

  it('gives every row a unique key', () => {
    const keys = SAMPLE_ROWS.map((row) => row.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every row exactly the declared columns', () => {
    const expected = [...SAMPLE_COLUMNS].sort();

    for (const row of SAMPLE_ROWS) {
      expect(Object.keys(row.columns).sort()).toEqual(expected);
    }
  });

  it('uses literal timestamps so repeated writes stay idempotent', () => {
    for (const row of SAMPLE_ROWS) {
      expect(row.columns.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    }
  });
});
