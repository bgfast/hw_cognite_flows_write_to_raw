import type { ListRawRows, RawDBRow, RawDBRowInsert } from '@cognite/sdk';

import { RAW_DATABASE_NAME, RAW_TABLE_NAME, SAMPLE_ROWS } from './sampleData';
import type { SampleRow } from './sampleData';

/** Verification reads are bounded; a full-table scan is never acceptable. */
export const VERIFY_ROW_LIMIT = 25;

export type RawRowRead = {
  key: string;
  columns: Record<string, unknown>;
};

export interface RawSampleService {
  writeSampleRows(): Promise<number>;
  readSampleRows(limit: number): Promise<RawRowRead[]>;
}

/**
 * The slice of `CogniteClient` this service needs. `CogniteClient` satisfies it
 * structurally, so tests can supply a plain object without any cast.
 */
export type RawRowsClient = {
  raw: {
    insertRows: (
      databaseName: string,
      tableName: string,
      items: RawDBRowInsert[],
      ensureParent?: boolean
    ) => Promise<object>;
    listRows: (
      databaseName: string,
      tableName: string,
      query?: ListRawRows
    ) => { autoPagingToArray: (options?: { limit?: number }) => Promise<RawDBRow[]> };
  };
};

export function createRawSampleService(client: RawRowsClient): RawSampleService {
  return new CdfRawSampleService(client);
}

class CdfRawSampleService implements RawSampleService {
  constructor(
    private readonly client: RawRowsClient,
    private readonly rows: SampleRow[] = SAMPLE_ROWS
  ) {}

  async writeSampleRows(): Promise<number> {
    const items: RawDBRowInsert[] = this.rows.map((row) => ({
      key: row.key,
      columns: { ...row.columns },
    }));

    await this.client.raw.insertRows(RAW_DATABASE_NAME, RAW_TABLE_NAME, items, true);

    return items.length;
  }

  async readSampleRows(limit: number): Promise<RawRowRead[]> {
    const rows = await this.client.raw
      .listRows(RAW_DATABASE_NAME, RAW_TABLE_NAME, { limit })
      .autoPagingToArray({ limit });

    return rows.map((row) => ({ key: row.key, columns: row.columns }));
  }
}
