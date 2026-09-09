/**
 * ORCA Weather Tool
 * Calls the existing OpenMeteoWeatherProvider directly (server-side).
 * Never duplicates API parsing — reuses the Milestone 2 provider.
 */

import { ToolResult } from '../../types';
import { openMeteoWeatherProvider } from '../../providers/openMeteoWeatherProvider';
import { ToolInput } from './registry';

export async function executeWeatherTool(input: ToolInput): Promise<ToolResult> {
  const startTime = Date.now();
  try {
    const weatherObs = await openMeteoWeatherProvider.getWeatherForecast(
      input.latitude,
      input.longitude,
      input.timeIso
    );
    return {
      tool: 'getWeather',
      success: true,
      data: weatherObs,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: weatherObs.source || 'Open-Meteo Forecast API (ERA5/GFS)',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tool: 'getWeather',
      success: false,
      error: message,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'Open-Meteo Forecast API',
    };
  }
}
