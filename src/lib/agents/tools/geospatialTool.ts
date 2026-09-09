/**
 * ORCA Geospatial Tool
 * Calls the existing findNearestPort() function from the Milestone 3 geospatial module.
 * Never uses LLM to calculate distances — pure deterministic computation.
 */

import { ToolResult } from '../../types';
import { findNearestPort } from '../../geospatial';
import { ToolInput } from './registry';

export async function executeGeospatialTool(input: ToolInput): Promise<ToolResult> {
  try {
    const nearestPort = findNearestPort(input.latitude, input.longitude);
    return {
      tool: 'findNearestPort',
      success: true,
      data: nearestPort,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'ORCA Indian Coastal Ports Reference Database (Haversine/Great Circle)',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tool: 'findNearestPort',
      success: false,
      error: message,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'ORCA Geospatial Module',
    };
  }
}
