/**
 * Everything this app writes to CDF RAW is fixed at compile time: the database,
 * the table, the column set, and the rows themselves. Keys and `updatedAt` are
 * literals rather than generated values, which keeps a repeated write an
 * idempotent upsert and keeps the tests free of clock dependencies.
 */

export const RAW_DATABASE_NAME = 'raw_sample_all_flows';
export const RAW_TABLE_NAME = 'hello_world';

export const SAMPLE_COLUMNS = ['name', 'location', 'status', 'pressureBar', 'updatedAt'] as const;

export type SampleColumn = (typeof SAMPLE_COLUMNS)[number];

export type SampleRowColumns = {
  name: string;
  location: string;
  status: string;
  pressureBar: number;
  updatedAt: string;
};

export type SampleRow = {
  key: string;
  columns: SampleRowColumns;
};

export const SAMPLE_ROWS: SampleRow[] = [
  {
    key: 'pump-101',
    columns: {
      name: 'Feed pump A',
      location: 'Valhall',
      status: 'running',
      pressureBar: 4.2,
      updatedAt: '2026-01-15T08:00:00.000Z',
    },
  },
  {
    key: 'pump-102',
    columns: {
      name: 'Feed pump B',
      location: 'Valhall',
      status: 'standby',
      pressureBar: 0,
      updatedAt: '2026-01-15T08:00:00.000Z',
    },
  },
  {
    key: 'valve-201',
    columns: {
      name: 'Inlet valve',
      location: 'Valhall',
      status: 'open',
      pressureBar: 3.8,
      updatedAt: '2026-01-15T08:05:00.000Z',
    },
  },
  {
    key: 'compressor-301',
    columns: {
      name: 'Gas compressor',
      location: 'Aasta Hansteen',
      status: 'running',
      pressureBar: 12.6,
      updatedAt: '2026-01-15T08:10:00.000Z',
    },
  },
  {
    key: 'tank-401',
    columns: {
      name: 'Buffer tank',
      location: 'Aasta Hansteen',
      status: 'maintenance',
      pressureBar: 1.1,
      updatedAt: '2026-01-15T08:15:00.000Z',
    },
  },
];
