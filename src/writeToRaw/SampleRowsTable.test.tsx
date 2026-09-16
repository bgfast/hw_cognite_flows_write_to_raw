import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SampleRowsTable } from './SampleRowsTable';

describe('SampleRowsTable', () => {
  it('renders a header for the row key and every column', () => {
    render(<SampleRowsTable caption="Sample rows" columns={['name', 'status']} rows={[]} />);

    expect(screen.getByRole('columnheader', { name: 'key' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'status' })).toBeInTheDocument();
  });

  it('renders one row per item, keyed by row key', () => {
    render(
      <SampleRowsTable
        caption="Sample rows"
        columns={['name']}
        rows={[
          { key: 'pump-101', columns: { name: 'Feed pump A' } },
          { key: 'valve-201', columns: { name: 'Inlet valve' } },
        ]}
      />
    );

    expect(screen.getByRole('rowheader', { name: 'pump-101' })).toBeInTheDocument();
    expect(screen.getByText('Feed pump A')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'valve-201' })).toBeInTheDocument();
  });

  it('formats non-string cell values and marks missing ones', () => {
    render(
      <SampleRowsTable
        caption="Sample rows"
        columns={['pressureBar', 'note']}
        rows={[{ key: 'pump-101', columns: { pressureBar: 4.2 } }]}
      />
    );

    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('serializes structured cell values', () => {
    render(
      <SampleRowsTable
        caption="Sample rows"
        columns={['tags', 'active']}
        rows={[{ key: 'pump-101', columns: { tags: ['a', 'b'], active: true } }]}
      />
    );

    expect(screen.getByText('["a","b"]')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('names the table for assistive technology', () => {
    render(<SampleRowsTable caption="Rows read back from CDF RAW" columns={['name']} rows={[]} />);

    expect(screen.getByRole('table', { name: 'Rows read back from CDF RAW' })).toBeInTheDocument();
  });
});
