import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { RawSampleService } from './rawSampleService';
import { RAW_DATABASE_NAME, RAW_TABLE_NAME, SAMPLE_ROWS } from './sampleData';
import type { WriteToRawHost } from './useWriteToRawViewModel';
import { WriteToRawPage } from './WriteToRawPage';

describe('WriteToRawPage', () => {
  it('shows the target table and the rows it will write before any write', () => {
    render(<WriteToRawPage service={makeService()} host={null} />);

    expect(screen.getByText(RAW_DATABASE_NAME)).toBeInTheDocument();
    expect(screen.getByText(RAW_TABLE_NAME)).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: SAMPLE_ROWS[0].key })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the CDF project the rows land in', () => {
    render(<WriteToRawPage service={makeService()} host={null} projectName="bgfast" />);

    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('bgfast')).toBeInTheDocument();
  });

  it('opens the RAW explorer on the written table in a new tab', async () => {
    const host = makeHost();
    render(<WriteToRawPage service={makeService()} host={host} />);

    await userEvent.click(screen.getByRole('button', { name: /open in raw explorer/i }));

    expect(host.navigateInternal).toHaveBeenCalledWith({
      path: '/raw',
      queryParams: {
        tabs: `[["${RAW_DATABASE_NAME}","${RAW_TABLE_NAME}",null]]`,
        activeTable: `["${RAW_DATABASE_NAME}","${RAW_TABLE_NAME}",null]`,
      },
      openInNewTab: true,
    });
  });

  it('hides the RAW explorer link when there is no Fusion host', () => {
    render(<WriteToRawPage service={makeService()} host={null} />);

    expect(screen.queryByRole('button', { name: /open in raw explorer/i })).not.toBeInTheDocument();
  });

  it('reports how many rows were written', async () => {
    render(<WriteToRawPage service={makeService()} host={null} />);

    await userEvent.click(screen.getByRole('button', { name: /write .* rows/i }));

    await waitFor(() =>
      expect(screen.getByText(`${SAMPLE_ROWS.length} rows written`)).toBeInTheDocument()
    );
  });

  it('disables the button while the write is in flight', async () => {
    const service = makeService({
      writeSampleRows: vi.fn(() => new Promise<number>(() => undefined)),
    });
    render(<WriteToRawPage service={service} host={null} />);
    const button = screen.getByRole('button', { name: /write .* rows/i });

    await userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
  });

  it('shows an actionable error when the write fails', async () => {
    const service = makeService({
      writeSampleRows: vi.fn(() => Promise.reject({ status: 403 })),
    });
    render(<WriteToRawPage service={service} host={null} />);

    await userEvent.click(screen.getByRole('button', { name: /write .* rows/i }));

    await waitFor(() => expect(screen.getByText(/rawAcl:WRITE/)).toBeInTheDocument());
  });

  it('reads rows back from CDF RAW when the verification panel is opened', async () => {
    const service = makeService();
    const host = makeHost();
    render(<WriteToRawPage service={service} host={host} />);

    await userEvent.click(screen.getByRole('button', { name: /verify in cdf raw/i }));

    await waitFor(() =>
      expect(screen.getByRole('table', { name: /read back/i })).toBeInTheDocument()
    );
    expect(host.syncInternalState).toHaveBeenCalledWith('{"resultsOpen":true}');
  });

  it('shows a reading indicator while the verification read is in flight', async () => {
    const service = makeService({
      readSampleRows: vi.fn(() => new Promise<never>(() => undefined)),
    });
    render(<WriteToRawPage service={service} host={null} />);

    await userEvent.click(screen.getByRole('button', { name: /verify in cdf raw/i }));

    await waitFor(() => expect(screen.getByText(/reading rows back/i)).toBeInTheDocument());
  });

  it('stops the reading indicator when the read fails', async () => {
    const service = makeService({
      readSampleRows: vi.fn(() => Promise.reject(new Error('Gateway timeout'))),
    });
    render(<WriteToRawPage service={service} host={null} />);

    await userEvent.click(screen.getByRole('button', { name: /verify in cdf raw/i }));

    await waitFor(() => expect(screen.getByText(/Gateway timeout/)).toBeInTheDocument());
    expect(screen.queryByText(/reading rows back/i)).not.toBeInTheDocument();
  });

  it('explains an empty table instead of showing a bare grid', async () => {
    const service = makeService({ readSampleRows: vi.fn(() => Promise.resolve([])) });
    render(<WriteToRawPage service={service} host={null} />);

    await userEvent.click(screen.getByRole('button', { name: /verify in cdf raw/i }));

    await waitFor(() => expect(screen.getByText(/no rows/i)).toBeInTheDocument());
  });
});

function makeService(overrides: Partial<RawSampleService> = {}): RawSampleService {
  return {
    writeSampleRows: vi.fn(() => Promise.resolve(SAMPLE_ROWS.length)),
    readSampleRows: vi.fn(() =>
      Promise.resolve([{ key: 'pump-101', columns: { name: 'Feed pump A' } }])
    ),
    ...overrides,
  };
}

function makeHost(): WriteToRawHost {
  return {
    syncInternalState: vi.fn(() => Promise.resolve(true)),
    navigateInternal: vi.fn(() => Promise.resolve(true)),
  };
}
