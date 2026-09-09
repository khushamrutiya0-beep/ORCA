/**
 * ORCA Agent Tool: analyzeMarineProductivity
 */

import { ToolDefinition, ToolResult } from '../../types';
import { analyzeMarineProductivity } from '../../analytics/marineProductivity';

export const productivityTool: ToolDefinition = {
  name: 'analyzeMarineProductivity',
  description: 'Correlate Sea Surface Temperature (SST) with chlorophyll-a to identify potentially favourable marine productivity zones.',
  parameters: [
    { name: 'latitude', type: 'number', description: 'Latitude of marine point', required: true },
    { name: 'longitude', type: 'number', description: 'Longitude of marine point', required: true },
    { name: 'liveSstValue', type: 'number', description: 'Optional live SST value in deg C', required: false },
  ],
  execute: async (input: { latitude: number; longitude: number; liveSstValue?: number }): Promise<ToolResult> => {
    const { latitude, longitude, liveSstValue } = input;
    try {
      const result = await analyzeMarineProductivity(latitude, longitude, liveSstValue);
      return {
        tool: 'analyzeMarineProductivity',
        success: true,
        data: result,
        sourceAttribution: result.sourceAttribution,
        retrievedAt: result.generatedAt,
        evidence: [
          {
            id: `ev-prod-${Date.now()}`,
            provider: 'Marine Productivity Engine',
            source: result.sourceAttribution,
            timestamp: result.generatedAt,
            status: 'DEMO',
            dataType: 'OCEAN',
            summary: result.suitabilitySummary,
            rawMetrics: { score: result.score, productivityIndex: result.productivityIndex },
          },
        ],
      };
    } catch (err: unknown) {
      return {
        tool: 'analyzeMarineProductivity',
        success: false,
        error: err instanceof Error ? err.message : 'Productivity analysis failed',
        sourceAttribution: 'ORCA Analytics Engine',
        retrievedAt: new Date().toISOString(),
      };
    }
  },
};
