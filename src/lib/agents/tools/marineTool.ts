/**
 * ORCA Marine Conditions Tool
 * Calls the existing OpenMeteoMarineProvider directly (server-side).
 * Never duplicates API parsing — reuses the Milestone 2 provider.
 */

import { ToolResult } from '../../types';
import { openMeteoMarineProvider } from '../../providers/openMeteoMarineProvider';
import { ToolInput } from './registry';

export async function executeMarineTool(input: ToolInput): Promise<ToolResult> {
  try {
    const oceanObs = await openMeteoMarineProvider.getOceanState(
      input.latitude,
      input.longitude,
      input.timeIso
    );
    return {
      tool: 'getMarineConditions',
      success: true,
      data: oceanObs,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: oceanObs.source || 'Open-Meteo Marine API (Copernicus / ECMWF / DWD)',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tool: 'getMarineConditions',
      success: false,
      error: message,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'Open-Meteo Marine API',
    };
  }
}
