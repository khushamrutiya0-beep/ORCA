/**
 * ORCA Weather Intelligence Agent
 * Specialized in surface meteorology, wind regimes, pressure gradients, and precipitation forecasts.
 * Strictly ground-truth: uses Open-Meteo Weather API tool. Never invents weather measurements.
 */

import { AgentRole, WeatherObservation } from '../types';
import { AgentContext, AgentResult, AgentTask, ISpecializedAgent } from './interfaces';
import { executeTool } from './tools/registry';

export class WeatherAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'WEATHER';
  readonly name = 'Weather Intelligence Agent';
  readonly description = 'Specialized in wind dynamics, atmospheric pressure, gust alerts, and precipitation forecasting along the Indian coastline.';

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const lat = context.location.latitude;
    const lon = context.location.longitude;
    const timeIso = context.timeRange.isoString;

    try {
      const toolRes = await executeTool('getWeather', {
        latitude: lat,
        longitude: lon,
        timeIso,
      });

      if (!toolRes.success || !toolRes.data) {
        return {
          agentName: this.name,
          success: false,
          summary: `Meteorological observations are currently unavailable for ${context.location.name}.`,
          warnings: ['Weather telemetry could not be retrieved from primary meteorological providers.'],
          evidence: [],
          provenance: [
            {
              source: 'Open-Meteo Weather API',
              provider: 'Open-Meteo Forecast Service',
              status: 'UNAVAILABLE',
              timestamp: new Date().toISOString(),
            },
          ],
          confidence: 'LOW',
          timestamp: new Date().toISOString(),
          executionTimeMs: Date.now() - startTime,
          error: toolRes.error || 'No weather data returned',
        };
      }

      const weather = toolRes.data as WeatherObservation;
      const windSpeed = weather.windSpeed?.value;
      const gusts = weather.windGusts?.value;
      const pressure = weather.surfacePressure?.value;
      const condition = weather.weatherDescription || 'Fair';

      const summary = `Wind: ${windSpeed ?? 'N/A'} km/h${gusts ? ` (gusts to ${gusts} km/h)` : ''}, Pressure: ${pressure ?? 'N/A'} hPa, Condition: ${condition}`;

      const warnings: string[] = [];
      if (gusts && gusts > 40) {
        warnings.push(`Elevated wind gusts of ${gusts} km/h detected near ${context.location.name}.`);
      }

      const evidence = toolRes.evidence || [];

      return {
        agentName: this.name,
        success: true,
        summary,
        structuredData: {
          windSpeedKmh: windSpeed,
          windGustsKmh: gusts,
          surfacePressureHpa: pressure,
          weatherCondition: condition,
          precipitationMmh: weather.precipitation?.value,
          weatherCode: weather.weatherCode?.value,
          status: weather.status,
          rawObservation: weather,
        },
        evidence,
        warnings,
        provenance: [
          {
            source: weather.source || 'Open-Meteo Forecast API',
            provider: 'Open-Meteo Forecast Service',
            status: weather.status,
            timestamp: weather.timestamp,
            metric: 'Wind, Pressure, Condition',
          },
        ],
        confidence: 'HIGH',
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        agentName: this.name,
        success: false,
        summary: `Error in Weather Intelligence Agent: ${message}`,
        warnings: ['Weather Agent encountered an unexpected execution failure.'],
        evidence: [],
        provenance: [],
        confidence: 'LOW',
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        error: message,
      };
    }
  }
}

export const weatherAgent = new WeatherAgent();
