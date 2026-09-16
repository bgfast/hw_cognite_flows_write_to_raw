# Feature Specification: hw-write-to-raw

Hello-world Flows app. A Cognite Flows builder at a desk on a laptop uses it to learn how to write rows into CDF RAW without assembling the call from docs.

The app has no configuration and no form. The database, table, columns, and sample rows are all constants in the source, so the builder's first click always succeeds and the source doubles as the copyable example.

Source: `App-Brief.md`.

## User Scenarios & Testing

### User Stories

1. As a Flows builder, I want one button that writes a fixed set of sample rows to CDF RAW so that I can copy a working pattern instead of assembling it from docs.

2. As a Flows builder, I want the app to create the RAW database and table if they do not exist so that I am not blocked on RAW Explorer setup.

3. As a Flows builder, I want to read the rows back inside the app so that I can confirm the write landed without switching to RAW Explorer.

### Acceptance Scenarios

- Given the app is open in Fusion with a signed-in user holding `rawAcl:WRITE`, when the user clicks Write sample rows, then the five sample rows are upserted into `raw_sample_all_flows` / `hello_world` and the UI reports how many rows were written.

- Given the database or table does not exist, when the user writes, then the app creates both (`ensureParent`) and still inserts the rows.

- Given the write succeeded, when the user opens the verification panel, then the app lists the rows it just read back from RAW, bounded to 25 rows.

- Given the verification panel was open before a reload, when the app loads again, then the panel is still open and re-reads the rows.

- Given the user lacks `rawAcl:WRITE`, when they click Write, then the app shows an error naming the missing capability and does not report success.

- Given the user clicks Write twice, when the second write completes, then the table still holds five rows, because each row has a fixed key and insert is an upsert.

## Requirements

### Functional Requirements

- FR-001: The app MUST replace the default Flows splash checklist with a single Write to RAW screen.

- FR-002: Database name, table name, column names, and sample row contents MUST be compile-time constants. The app MUST NOT offer inputs for them.

- FR-003: Every sample row MUST have a stable literal key and a literal `updatedAt` value. The app MUST NOT generate keys or read the clock, so repeated writes are idempotent and tests are deterministic.

- FR-004: The screen MUST show the rows that are about to be written, before any write happens.

- FR-005: On Write, the app MUST call `client.raw.insertRows(database, table, rows, true)`. The fourth argument is the positional `ensureParent` boolean — not an options object.

- FR-006: After a successful write, the app MUST report the row count, database, and table.

- FR-007: After a failed write, the app MUST show a user-visible error, distinguishing a missing-capability failure (CDF 403) from other failures.

- FR-008: Read-back MUST use `client.raw.listRows(...).autoPagingToArray({ limit: 25 })`. Unbounded reads and client-side filtering of a full table are prohibited.

- FR-009: Verification-panel visibility MUST be host-synced via `syncInternalState` / `initialState`, and MUST drive a read on load when restored as open.

- FR-010: The app MUST use `@cognite/app-sdk` for the host connection and `useCogniteSdk()` for the CDF client. No hardcoded cluster URLs, no `new CogniteClient` outside bootstrap.

- FR-011: UI MUST use Aura primitives (Card, Button, Alert, Badge, Loader, Separator) imported per-component. The row table is the one documented exception (see Aura gap below).

### Non-goals

- Editing, deleting, or filtering rows
- User-supplied database, table, column, or row values
- Data modeling (DMS views/containers)
- Atlas / agent chat
- Bulk upload or pagination beyond the 25-row verification read
- Mobile layout

### Known Aura gap

Aura 0.3.5 exposes no `components/table` primitive. The only tabular primitive is `@cognite/aura/data-grid`, which requires the optional peers `@tanstack/react-table` and `@tanstack/react-virtual`. For five static rows that machinery is disproportionate, so the row list is a semantic `<table>` styled with Aura semantic tokens only. No raw color, spacing, or font values.

## Success Criteria

- SC-001: A first-time Flows builder writes visible rows to a RAW table on the first try in under 10 minutes, instead of spending a full session piecing the call together. (App brief)

- SC-002: The happy path is one click with zero configuration and zero RAW Explorer setup.

- SC-003: `npm run lint`, `npm test`, and `npm run build` all pass with no pre-existing failures.

- SC-004: Line coverage across `src/**` is at least 80%, excluding only tests and `src/main.tsx`.

## Clarifications

- Database name follows the CDF RAW convention `raw_{data_type}_{location}_{source}` → `raw_sample_all_flows`. Table is `hello_world`.
- RAW row insert is an upsert on `key`; reusing a key replaces that row's columns.
- Read-back requires `rawAcl:READ` in addition to `rawAcl:WRITE`.
- `manifest.json` keeps `permissions.network: []`. The CDF cluster origin is allowed automatically and must not be listed.

## Assumptions

- Target customer / project: `bgfast` (Bluefield), as in `app.json`.
- The user is already authenticated in Fusion; no login UI.
- The user usually holds `rawAcl:WRITE` and `rawAcl:READ` in this demo project; the app still handles 403.
- Desktop laptop use; no mobile layout work.
- No user interviews yet; the brief records an assumption about how new Flows builders learn RAW.

---

## Data Models & CDF Integration *(mandatory)*

This app does **not** use CDF Data Modeling — no spaces, views, or containers. It writes to **CDF RAW** only.

### Existing views

None.

### New views

None.

### Spaces

None.

### RAW

| Resource | Value | Notes |
| --- | --- | --- |
| Database | `raw_sample_all_flows` | Created on first write when missing |
| Table | `hello_world` | Created on first write when missing |
| Capabilities | `rawAcl:WRITE`, `rawAcl:READ` | Write for insert, read for verification |

Fixed columns on every row:

| Column | Type | Example |
| --- | --- | --- |
| `name` | string | `Feed pump A` |
| `location` | string | `Valhall` |
| `status` | string | `running` |
| `pressureBar` | number | `4.2` |
| `updatedAt` | string (literal ISO-8601) | `2026-01-15T08:00:00.000Z` |

Five sample rows, keyed `pump-101`, `pump-102`, `valve-201`, `compressor-301`, `tank-401`.

### Verified SDK contract

From `node_modules/@cognite/sdk/dist/src/api/raw/rawApi.d.ts`:

```ts
insertRows: (databaseName: string, tableName: string, items: RawDBRowInsert[], ensureParent?: boolean) => Promise<object>;
listRows: (databaseName: string, tableName: string, query?: ListRawRows) => CursorAndAsyncIterator<RawDBRow>;
```

- `RawDBRowInsert` is `{ key: string; columns: Record<string, unknown> }`.
- `listRows` returns a cursor iterator, not an array. Resolve it with `autoPagingToArray({ limit })`.

Docs: [Insert rows into a table](https://docs.cognite.com/20230101/raw/insert-rows-into-a-table).
