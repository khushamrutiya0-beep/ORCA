/**
 * ORCA Agent Tool: getTide
 */

import { ToolDefinition, ToolResult } from '../../types';
import { tideProvider } from '../../providers/tide/ITideProvider';

export const tideTool: ToolDefinition = {
  name: 'getTide',
  description: 'Retrieve tidal observations, astronomical tide stage, and gauge station reference for marine coordinates.',
  parameters: [
    { name: 'latitude', type: 'number', description: 'Latitude of marine point', required: true },
    { name: 'longitude', type: 'number', description: 'Longitude of marine point', required: true },
  ],
  execute: async (input: { latitude: number; longitude: number }): Promise<ToolResult> => {
    const { latitude, longitude } = input;
    try {
      const result = await tideProvider.getTideForecast(latitude, longitude);
      return {
        tool: 'getTide',
        success: true,
        data: result,
        sourceAttribution: result.source,
        retrievedAt: result.retrievedAt,
        evidence: [
          {
            id: `ev-tide-${Date.now()}`,
            provider: 'Tide Gauge Network',
            source: result.source,
            timestamp: result.retrievedAt,
            status: 'UNAVAILABLE',
            dataType: 'OCEAN',
            summary: `Tide status for ${result.station.name}: ${result.status} (Public machine-readable API not connected)`,
            rawMetrics: { stationName: result.station.name, status: result.status },
          },
        ],
      };
    } catch (err: unknown) {
      return {
        tool: 'getTide',
        success: false,
        error: err instanceof Error ? err.message : 'Tide tool failed',
        sourceAttribution: 'Survey of India / INCOIS',
        retrievedAt: new Date().toISOString(),
      };
    }
  },
};
