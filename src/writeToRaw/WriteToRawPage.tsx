import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components/card';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Loader } from '@cognite/aura/components/loader';
import { Separator } from '@cognite/aura/components/separator';
import { IconExternalLink } from '@tabler/icons-react';

import type { RawSampleService } from './rawSampleService';
import { SampleRowsTable } from './SampleRowsTable';
import { useWriteToRawViewModel } from './useWriteToRawViewModel';
import type { WriteToRawHost } from './useWriteToRawViewModel';

type WriteToRawPageProps = {
  service: RawSampleService;
  host: WriteToRawHost | null;
  /** Read from the SDK client at runtime, so it follows the current CDF project. */
  projectName?: string;
  initialState?: string;
};

export function WriteToRawPage({
  service,
  host,
  projectName,
  initialState,
}: WriteToRawPageProps) {
  const vm = useWriteToRawViewModel({ service, host, initialState });

  return (
    <main className="min-h-screen bg-muted/50 text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center p-4 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle as="h1">Write sample rows to CDF RAW</CardTitle>
            <CardDescription>
              Upserts the rows below into CDF RAW, creating the database and table if needed.
              Writing twice changes nothing.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {projectName ? <RawLocation label="Project" value={projectName} /> : null}
                <RawLocation label="Database" value={vm.databaseName} />
                <RawLocation label="Table" value={vm.tableName} />
              </dl>
              {vm.canOpenRawExplorer ? (
                <Button variant="ghost" onClick={() => void vm.openRawExplorer()}>
                  <IconExternalLink aria-hidden className="size-4" />
                  Open in RAW explorer
                </Button>
              ) : null}
            </div>

            <SampleRowsTable
              caption="Sample rows this app will write"
              columns={vm.columns}
              rows={vm.rowsToWrite}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void vm.write()} disabled={vm.isWriting}>
                {vm.isWriting ? 'Writing...' : `Write ${vm.rowsToWrite.length} rows`}
              </Button>
              <Button variant="secondary" onClick={() => void vm.toggleResults()}>
                {vm.isResultsOpen ? 'Hide verification' : 'Verify in CDF RAW'}
              </Button>
              {vm.isWriting ? <Loader size={20} /> : null}
            </div>

            {vm.status === 'success' ? (
              <Alert variant="info">
                <AlertTitle>{vm.writtenCount} rows written</AlertTitle>
                <AlertDescription>
                  Upserted into {vm.databaseName} / {vm.tableName}.
                </AlertDescription>
              </Alert>
            ) : null}

            {vm.errorMessage ? (
              <Alert variant="error">
                <AlertDescription>{vm.errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {vm.isResultsOpen ? (
              <>
                <Separator />
                <VerificationPanel
                  columns={vm.columns}
                  isReading={vm.isReadingRows}
                  rows={vm.rowsFromRaw}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function RawLocation({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <Badge variant="nordic" background>
          {value}
        </Badge>
      </dd>
    </div>
  );
}

type VerificationPanelProps = {
  columns: readonly string[];
  isReading: boolean;
  rows: { key: string; columns: Record<string, unknown> }[] | null;
};

function VerificationPanel({ columns, isReading, rows }: VerificationPanelProps) {
  if (isReading) {
    return (
      <div className="inline-flex items-center gap-3 text-muted-foreground">
        <Loader size={20} />
        <span>Reading rows back from CDF RAW...</span>
      </div>
    );
  }

  // The read failed and the error alert above already explains why.
  if (rows === null) return null;

  if (rows.length === 0) {
    return (
      <EmptyState variant="compact">
        <EmptyStateTitle as="p">No rows in the table yet</EmptyStateTitle>
        <EmptyStateDescription>
          Write the sample rows first, then verify again.
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return <SampleRowsTable caption="Rows read back from CDF RAW" columns={columns} rows={rows} />;
}
