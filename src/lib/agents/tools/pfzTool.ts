/**
 * ORCA PFZ Tool — Milestone 5
 * Returns PFZ data for the given coordinates.
 * Always DEMO until INCOIS provides a verified API.
 */

import { ToolResult } from '../../types';
import { demoPfzProvider } from '../../providers/pfz/demoPfzProvider';

export async function executePfzTool(input: {
  latitude: number;
  longitude: number;
}): Promise<ToolResult> {
  const retrievedAt = new Date().toISOString();
  try {
    const result = await demoPfzProvider.getPFZZones(input.latitude, input.longitude);
    return {
      tool: 'getPFZ',
      success: true,
      data: result,
      retrievedAt,
      sourceAttribution: result.source,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tool: 'getPFZ',
      success: false,
      error: message,
      retrievedAt,
      sourceAttribution: 'ORCA PFZ Engine',
    };
  }
}
