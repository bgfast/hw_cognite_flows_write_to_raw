/**
 * Deep link into Fusion's RAW explorer. The host resolves the organisation,
 * project, cluster, and workspace, so only the route and its query belong here.
 */
export const RAW_EXPLORER_PATH = '/raw';

export function buildRawExplorerQuery(
  databaseName: string,
  tableName: string
): Record<string, string> {
  // Fusion represents an open RAW tab as [database, table, null].
  const tab = [databaseName, tableName, null];

  return {
    tabs: JSON.stringify([tab]),
    activeTable: JSON.stringify(tab),
  };
}
