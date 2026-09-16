type SampleRowsTableProps = {
  caption: string;
  columns: readonly string[];
  rows: { key: string; columns: Record<string, unknown> }[];
};

/**
 * Aura 0.3.5 has no `table` primitive, and its `data-grid` needs
 * `@tanstack/react-table` plus `@tanstack/react-virtual` — disproportionate for
 * five static rows. This is a semantic table using Aura tokens only, no raw
 * colour or spacing values. See the Aura gap note in SPEC.md.
 */
export function SampleRowsTable({ caption, columns, rows }: SampleRowsTableProps) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border">
          <th scope="col" className="py-2 pr-4 font-medium text-muted-foreground">
            key
          </th>
          {columns.map((column) => (
            <th key={column} scope="col" className="py-2 pr-4 font-medium text-muted-foreground">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-border last:border-b-0">
            <th scope="row" className="py-2 pr-4 font-normal">
              {row.key}
            </th>
            {columns.map((column) => (
              <td key={column} className="py-2 pr-4 text-muted-foreground">
                {formatCell(row.columns[column])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
}
