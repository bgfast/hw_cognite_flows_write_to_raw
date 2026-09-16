import type { RawDBRow } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { createRawSampleService, VERIFY_ROW_LIMIT } from './rawSampleService';
import type { RawRowsClient } from './rawSampleService';
import { RAW_DATABASE_NAME, RAW_TABLE_NAME, SAMPLE_ROWS } from './sampleData';

describe('createRawSampleService', () => {
  describe('writeSampleRows', () => {
    it('inserts every sample row with ensureParent enabled', async () => {
      // Arrange
      const client = makeClient();
      const service = createRawSampleService(client);

      // Act
      await service.writeSampleRows();

      // Assert — the fourth argument is a positional boolean, not an options object.
      expect(client.raw.insertRows).toHaveBeenCalledWith(
        RAW_DATABASE_NAME,
        RAW_TABLE_NAME,
        SAMPLE_ROWS.map((row) => ({ key: row.key, columns: { ...row.columns } })),
        true
      );
    });

    it('returns the number of rows written', async () => {
      const service = createRawSampleService(makeClient());

      await expect(service.writeSampleRows()).resolves.toBe(SAMPLE_ROWS.length);
    });

    it('rejects when CDF refuses the insert', async () => {
      const client = makeClient();
      vi.mocked(client.raw.insertRows).mockRejectedValue(new Error('403 forbidden'));
      const service = createRawSampleService(client);

      await expect(service.writeSampleRows()).rejects.toThrow('403 forbidden');
    });
  });

  describe('readSampleRows', () => {
    it('bounds the read on both the query and the auto-pager', async () => {
      // Arrange
      const autoPagingToArray = vi.fn(() => Promise.resolve([]));
      const client = makeClient({ autoPagingToArray });
      const service = createRawSampleService(client);

      // Act
      await service.readSampleRows(VERIFY_ROW_LIMIT);

      // Assert
      expect(client.raw.listRows).toHaveBeenCalledWith(RAW_DATABASE_NAME, RAW_TABLE_NAME, {
        limit: VERIFY_ROW_LIMIT,
      });
      expect(autoPagingToArray).toHaveBeenCalledWith({ limit: VERIFY_ROW_LIMIT });
    });

    it('maps rows to the shape the view renders', async () => {
      const client = makeClient({
        autoPagingToArray: vi.fn(() => Promise.resolve([makeRawRow()])),
      });
      const service = createRawSampleService(client);

      const rows = await service.readSampleRows(VERIFY_ROW_LIMIT);

      expect(rows).toEqual([{ key: 'pump-101', columns: { name: 'Feed pump A' } }]);
    });

    it('treats a database that does not exist yet as an empty table', async () => {
      // A first-time user verifies before writing: CDF answers 404, which means
      // "nothing here yet", not "something went wrong".
      const client = makeClient({
        autoPagingToArray: vi.fn(() =>
          Promise.reject({ status: 404, message: 'Following databases not found' })
        ),
      });
      const service = createRawSampleService(client);

      await expect(service.readSampleRows(VERIFY_ROW_LIMIT)).resolves.toEqual([]);
    });

    it('rejects when CDF refuses the read', async () => {
      const client = makeClient({
        autoPagingToArray: vi.fn(() => Promise.reject(new Error('403 forbidden'))),
      });
      const service = createRawSampleService(client);

      await expect(service.readSampleRows(VERIFY_ROW_LIMIT)).rejects.toThrow('403 forbidden');
    });
  });
});

function makeClient(
  options: { autoPagingToArray?: () => Promise<RawDBRow[]> } = {}
): RawRowsClient {
  const autoPagingToArray = options.autoPagingToArray ?? (() => Promise.resolve([]));

  return {
    raw: {
      insertRows: vi.fn(() => Promise.resolve({})),
      listRows: vi.fn(() => ({ autoPagingToArray })),
    },
  };
}

function makeRawRow(): RawDBRow {
  return {
    key: 'pump-101',
    columns: { name: 'Feed pump A' },
    lastUpdatedTime: new Date('2026-01-15T08:00:00.000Z'),
  };
}
