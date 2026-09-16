import { describe, expect, it } from 'vitest';

import { RAW_EXPLORER_PATH, buildRawExplorerQuery } from './rawExplorerLink';

describe('rawExplorerLink', () => {
  it('points at the Fusion RAW explorer route', () => {
    expect(RAW_EXPLORER_PATH).toBe('/raw');
  });

  it('opens the table as a tab and makes it the active one', () => {
    // Fusion encodes each tab as [database, table, null].
    const query = buildRawExplorerQuery('raw_sample_all_flows', 'hello_world');

    expect(query).toEqual({
      tabs: '[["raw_sample_all_flows","hello_world",null]]',
      activeTable: '["raw_sample_all_flows","hello_world",null]',
    });
  });

  it('carries whichever database and table it is given', () => {
    const query = buildRawExplorerQuery('other_db', 'other_table');

    expect(query.activeTable).toBe('["other_db","other_table",null]');
  });
});
