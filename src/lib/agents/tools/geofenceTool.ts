/**
 * ORCA Agent Tool: getGeofences
 */

import { ToolDefinition, ToolResult } from '../../types';
import { checkGeofences } from '../../geofencing/geofenceService';

export const geofenceTool: ToolDefinition = {
  name: 'getGeofences',
  description: 'Check marine coordinates against Marine Protected Areas (MPAs), sensitive coral zones, and international maritime boundaries.',
  parameters: [
    { name: 'latitude', type: 'number', description: 'Latitude of marine point', required: true },
    { name: 'longitude', type: 'number', description: 'Longitude of marine point', required: true },
    { name: 'radiusKm', type: 'number', description: 'Proximity search radius in km', required: false },
  ],
  execute: async (input: { latitude: number; longitude: number; radiusKm?: number }): Promise<ToolResult> => {
    const { latitude, longitude, radiusKm = 60 } = input;
    try {
      const result = checkGeofences(latitude, longitude, radiusKm);
      const warningsText = result.warnings.length > 0 ? result.warnings.join(' | ') : 'No restricted zones within search buffer.';

      return {
        tool: 'getGeofences',
        success: true,
        data: result,
        sourceAttribution: result.sourceAttribution,
        retrievedAt: result.retrievedAt,
        evidence: [
          {
            id: `ev-geo-${Date.now()}`,
            provider: 'MoEFCC / WII MPA Registry',
            source: result.sourceAttribution,
            timestamp: result.retrievedAt,
            status: 'LIVE',
            dataType: 'GEOSPATIAL',
            summary: `Maritime Geofence: ${warningsText}`,
            rawMetrics: { isRestricted: result.isRestricted, insideCount: result.insideZones.length, nearbyCount: result.nearbyZones.length },
          },
        ],
      };
    } catch (err: unknown) {
      return {
        tool: 'getGeofences',
        success: false,
        error: err instanceof Error ? err.message : 'Geofence check failed',
        sourceAttribution: 'MoEFCC / WII Reference Database',
        retrievedAt: new Date().toISOString(),
      };
    }
  },
};
