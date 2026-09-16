import type { ConnectToHostAppResult, HostAppAPI } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { RAW_DATABASE_NAME, RAW_TABLE_NAME } from './writeToRaw/sampleData';

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

type AppApi = Pick<HostAppAPI, 'syncInternalState'>;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while the host connection is pending', () => {
    render(
      <App deps={makeLoadingDeps()} connectToHostApp={() => new Promise<never>(() => undefined)} />
    );

    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders the write screen with the fixed RAW target', async () => {
    render(<App deps={makeDeps()} connectToHostApp={makeConnectedFn()} />);

    await waitFor(() =>
      expect(screen.getByText('Write sample rows to CDF RAW')).toBeInTheDocument()
    );
    expect(screen.getByText(RAW_DATABASE_NAME)).toBeInTheDocument();
    expect(screen.getByText(RAW_TABLE_NAME)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /write 5 rows/i })).toBeInTheDocument();
  });

  it('restores the verification panel from host state', async () => {
    const api = makeApi();
    render(
      <App
        deps={makeDeps()}
        connectToHostApp={() =>
          Promise.resolve({ api, initialState: JSON.stringify({ resultsOpen: true }) })
        }
      />
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /hide verification/i })).toBeInTheDocument()
    );
  });
});

function makeApi(): AppApi {
  return {
    syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
  };
}

function makeConnectedFn(api: AppApi = makeApi()) {
  return vi.fn(() => Promise.resolve({ api }));
}

function makeDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api: {
          getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('bgfast')),
          getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
          getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
          getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
        } as Partial<HostAppAPI> as HostAppAPI,
      })
    ),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function makeLoadingDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(
      () => new Promise<ConnectToHostAppResult>(() => undefined)
    ),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}
