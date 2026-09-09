/**
 * ORCA Source Status Tool — Milestone 5
 * Returns the health status of all configured data sources.
 */

import { ToolResult } from '../../types';
import { getAllSources, getSourceHealthSummary } from '../../dataSources/sourceRegistry';

export async function executeSourceTool(): Promise<ToolResult> {
  const retrievedAt = new Date().toISOString();
  const sources = getAllSources();
  const summary = getSourceHealthSummary();
  return {
    tool: 'getDataSourceStatus',
    success: true,
    data: { sources, summary },
    retrievedAt,
    sourceAttribution: 'ORCA Source Registry',
  };
}
