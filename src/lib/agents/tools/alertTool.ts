/**
 * ORCA Alert Tool — Milestone 5
 * Queries the alert aggregator for verified maritime alerts.
 * Never fabricates alerts. Clearly reports unavailable providers.
 */

import { ToolResult } from '../../types';
import { getAggregatedAlerts } from '../../alerts/alertAggregator';

export async function executeAlertTool(input: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}): Promise<ToolResult> {
  const retrievedAt = new Date().toISOString();
  const radiusKm = input.radiusKm ?? 2000;

  try {
    const result = await getAggregatedAlerts(input.latitude, input.longitude, radiusKm);

    return {
      tool: 'getMarineAlerts',
      success: true,
      data: result,
      retrievedAt,
      sourceAttribution: result.liveProviders.length > 0
        ? result.liveProviders.join(', ')
        : 'No live alert providers connected',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tool: 'getMarineAlerts',
      success: false,
      error: `Alert aggregator error: ${message}`,
      retrievedAt,
      sourceAttribution: 'ORCA Alert Intelligence Engine',
    };
  }
}
