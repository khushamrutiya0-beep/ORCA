/**
 * ORCA Agent Tool: analyzeHistoricalMarineConditions
 */

import { ToolDefinition, ToolResult } from '../../types';
import { analyzeHistoricalMarineConditions } from '../../analytics/historicalAnalysis';

export const historicalTool: ToolDefinition = {
  name: 'analyzeHistoricalMarineConditions',
  description: 'Analyze multi-week seasonal environmental baselines, SST anomalies, and environmental correlations.',
  parameters: [
    { name: 'latitude', type: 'number', description: 'Latitude of marine point', required: true },
    { name: 'longitude', type: 'number', description: 'Longitude of marine point', required: true },
  ],
  execute: async (input: { latitude: number; longitude: number }): Promise<ToolResult> => {
    const { latitude, longitude } = input;
    try {
      const result = analyzeHistoricalMarineConditions(latitude, longitude);
      return {
        tool: 'analyzeHistoricalMarineConditions',
        success: true,
        data: result,
        sourceAttribution: result.sourceAttribution,
        retrievedAt: result.generatedAt,
        evidence: [
          {
            id: `ev-hist-${Date.now()}`,
            provider: 'Historical Climatology Engine',
            source: result.sourceAttribution,
            timestamp: result.generatedAt,
            status: 'LIVE',
            dataType: 'OCEAN',
            summary: `${result.findings} Note: ${result.dataLimitations}`,
            rawMetrics: { sstAnomalyDegC: result.sstAnomalyDegC, chlorophyllTrend: result.chlorophyllTrend },
          },
        ],
      };
    } catch (err: unknown) {
      return {
        tool: 'analyzeHistoricalMarineConditions',
        success: false,
        error: err instanceof Error ? err.message : 'Historical analysis failed',
        sourceAttribution: 'ORCA Climatology Reference',
        retrievedAt: new Date().toISOString(),
      };
    }
  },
};
