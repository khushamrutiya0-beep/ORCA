/**
 * ORCA Agent Tool: findSafestRoute
 */

import { ToolDefinition, ToolResult } from '../../types';
import { optimizeSafestRoute } from '../../routing/routeOptimizer';
import { COASTAL_CITY_LOOKUP } from './locationTool';

export const routeTool: ToolDefinition = {
  name: 'findSafestRoute',
  description: 'Compute a prototype risk-aware maritime passage route avoiding severe sea states, strong winds, and protected marine sanctuaries.',
  parameters: [
    { name: 'originLat', type: 'number', description: 'Origin latitude', required: true },
    { name: 'originLon', type: 'number', description: 'Origin longitude', required: true },
    { name: 'originName', type: 'string', description: 'Origin location name', required: false },
    { name: 'destLat', type: 'number', description: 'Destination latitude', required: true },
    { name: 'destLon', type: 'number', description: 'Destination longitude', required: true },
    { name: 'destName', type: 'string', description: 'Destination location name', required: false },
    { name: 'waveHeightM', type: 'number', description: 'Significant wave height along route', required: false },
    { name: 'windSpeedKmh', type: 'number', description: 'Sustained wind speed along route', required: false },
  ],
  execute: async (input: {
    originLat: number;
    originLon: number;
    originName?: string;
    destLat: number;
    destLon: number;
    destName?: string;
    waveHeightM?: number;
    windSpeedKmh?: number;
  }): Promise<ToolResult> => {
    try {
      const result = optimizeSafestRoute({
        origin: {
          name: input.originName || 'Origin Port',
          latitude: input.originLat,
          longitude: input.originLon,
        },
        destination: {
          name: input.destName || 'Destination Port',
          latitude: input.destLat,
          longitude: input.destLon,
        },
        waveHeightM: input.waveHeightM,
        windSpeedKmh: input.windSpeedKmh,
      });

      return {
        tool: 'findSafestRoute',
        success: true,
        data: result,
        sourceAttribution: 'ORCA Safe Passage Optimization Engine (Prototype Model)',
        retrievedAt: result.generatedAt,
        evidence: [
          {
            id: `ev-route-${Date.now()}`,
            provider: 'Route Optimization Engine',
            source: 'ORCA Deterministic Routing Engine',
            timestamp: result.generatedAt,
            status: 'LIVE',
            dataType: 'GEOSPATIAL',
            summary: `Passage from ${result.origin.name} to ${result.destination.name}: ${result.totalDistanceNM} NM, ${result.waypoints.length} waypoints. Avoided zones: ${result.avoidedZones.length > 0 ? result.avoidedZones.join(', ') : 'None'}.`,
            rawMetrics: { totalDistanceKm: result.totalDistanceKm, totalDistanceNM: result.totalDistanceNM, overallRouteRisk: result.overallRouteRisk },
          },
        ],
      };
    } catch (err: unknown) {
      return {
        tool: 'findSafestRoute',
        success: false,
        error: err instanceof Error ? err.message : 'Route optimization failed',
        sourceAttribution: 'ORCA Routing Engine',
        retrievedAt: new Date().toISOString(),
      };
    }
  },
};
