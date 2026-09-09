/**
 * ORCA Agent Tool: getChlorophyll
 */

import { ToolDefinition, ToolResult } from '../../types';
import { demoSatelliteProvider } from '../../providers/satellite/ISatelliteProvider';

export const chlorophyllTool: ToolDefinition = {
  name: 'getChlorophyll',
  description: 'Retrieve satellite ocean color chlorophyll-a concentration for marine coordinates (DEMO Layer).',
  parameters: [
    { name: 'latitude', type: 'number', description: 'Latitude of marine point', required: true },
    { name: 'longitude', type: 'number', description: 'Longitude of marine point', required: true },
  ],
  execute: async (input: { latitude: number; longitude: number }): Promise<ToolResult> => {
    const { latitude, longitude } = input;
    try {
      const result = await demoSatelliteProvider.getChlorophyll(latitude, longitude);
      return {
        tool: 'getChlorophyll',
        success: true,
        data: result,
        sourceAttribution: result.source,
        retrievedAt: result.retrievedAt,
        evidence: [
          {
            id: `ev-chloro-${Date.now()}`,
            provider: 'Satellite Ocean Color Proxy',
            source: result.source,
            timestamp: result.retrievedAt,
            status: 'DEMO',
            dataType: 'OCEAN',
            summary: `Chlorophyll-a: ${result.value} mg/m³ (${result.classification} productivity signal) [DEMO Layer]`,
            rawMetrics: { value: result.value, unit: result.unit, classification: result.classification },
          },
        ],
      };
    } catch (err: unknown) {
      return {
        tool: 'getChlorophyll',
        success: false,
        error: err instanceof Error ? err.message : 'Chlorophyll tool failed',
        sourceAttribution: 'ORCA Satellite Ocean Color',
        retrievedAt: new Date().toISOString(),
      };
    }
  },
};
