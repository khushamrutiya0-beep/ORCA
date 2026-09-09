/**
 * ORCA Ocean Intelligence Agent
 * Specialized in oceanographic telemetry, sea state dynamics, wave spectra, swell, SST, ocean currents, and tide gauge networks.
 * Strictly ground-truth: uses Open-Meteo Marine API, satellite ocean color tools, and tide station feeds.
 */

import { AgentRole, OceanObservation } from '../types';
import { AgentContext, AgentResult, AgentTask, ISpecializedAgent } from './interfaces';
import { executeTool } from './tools/registry';

export class OceanAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'OCEAN';
  readonly name = 'Ocean Intelligence Agent';
  readonly description = 'Specialized in wave mechanics, sea state, swell propagation, SST fronts, ocean currents, and tidal station data.';

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const lat = context.location.latitude;
    const lon = context.location.longitude;
    const timeIso = context.timeRange.isoString;

    try {
      // 1. Fetch live marine oceanographic telemetry
      const marineToolPromise = executeTool('getMarineConditions', {
        latitude: lat,
        longitude: lon,
        timeIso,
      });

      // 2. Fetch tide station telemetry (honestly flagged UNAVAILABLE)
      const tideToolPromise = executeTool('getTide', {
        latitude: lat,
        longitude: lon,
      });

      // 3. Fetch satellite chlorophyll proxy
      const chloroToolPromise = executeTool('getChlorophyll', {
        latitude: lat,
        longitude: lon,
      });

      const [marineRes, tideRes, chloroRes] = await Promise.all([
        marineToolPromise,
        tideToolPromise,
        chloroToolPromise,
      ]);

      if (!marineRes.success || !marineRes.data) {
        return {
          agentName: this.name,
          success: false,
          summary: `Oceanographic telemetry is DATA_UNAVAILABLE for ${context.location.name}. Coordinates may be inland or outside marine grid coverage.`,
          warnings: ['No oceanographic model data found for the selected geographic coordinate.'],
          evidence: [],
          provenance: [
            {
              source: 'Open-Meteo Marine API',
              provider: 'Copernicus Marine / ECMWF / DWD',
              status: 'UNAVAILABLE',
              timestamp: new Date().toISOString(),
            },
          ],
          confidence: 'LOW',
          timestamp: new Date().toISOString(),
          executionTimeMs: Date.now() - startTime,
          error: marineRes.error || 'Ocean data unavailable',
        };
      }

      const ocean = marineRes.data as OceanObservation;
      const waveH = ocean.waveHeight?.value;
      const wavePeriod = ocean.wavePeriod?.value;
      const swellH = ocean.swellWaveHeight?.value;
      const sst = ocean.seaSurfaceTemperature?.value;
      const currentVel = ocean.oceanCurrentVelocity?.value;
      const currentDir = ocean.oceanCurrentDirection?.value;

      const tideData = tideRes.success ? (tideRes.data as Record<string, unknown>) : null;
      const chloroData = chloroRes.success ? (chloroRes.data as Record<string, unknown>) : null;

      const summaryParts = [
        waveH !== null && waveH !== undefined ? `Wave Height: ${waveH} m` : null,
        swellH !== null && swellH !== undefined ? `Swell: ${swellH} m` : null,
        wavePeriod !== null && wavePeriod !== undefined ? `Period: ${wavePeriod} s` : null,
        sst !== null && sst !== undefined ? `SST: ${sst}°C` : null,
        currentVel !== null && currentVel !== undefined ? `Current: ${currentVel} m/s` : null,
      ].filter(Boolean);

      const summary = summaryParts.length > 0
        ? summaryParts.join(', ')
        : 'Ocean telemetry active but numerical metrics are limited.';

      const warnings: string[] = [];
      if (waveH && waveH > 2.0) {
        warnings.push(`High wave alert: Significant wave height of ${waveH}m exceeds calm thresholds.`);
      }
      if (currentVel && currentVel > 0.8) {
        warnings.push(`Strong ocean surface current detected (${currentVel} m/s).`);
      }

      const evidence = [
        ...(marineRes.evidence || []),
        ...(tideRes.evidence || []),
        ...(chloroRes.evidence || []),
      ];

      return {
        agentName: this.name,
        success: true,
        summary,
        structuredData: {
          waveHeightM: waveH,
          wavePeriodS: wavePeriod,
          swellHeightM: swellH,
          seaSurfaceTemperatureDegC: sst,
          oceanCurrentVelocityMs: currentVel,
          oceanCurrentDirectionDeg: currentDir,
          status: ocean.status,
          tideContext: tideData,
          chlorophyllContext: chloroData,
          rawObservation: ocean,
        },
        evidence,
        warnings,
        provenance: [
          {
            source: ocean.source || 'Open-Meteo Marine API',
            provider: 'Copernicus Marine / ECMWF / DWD',
            status: ocean.status,
            timestamp: ocean.timestamp,
            metric: 'Wave, Swell, SST, Currents',
          },
          {
            source: 'Survey of India / INCOIS Tide Gauges',
            provider: 'Survey of India National Hydrographic Network',
            status: 'UNAVAILABLE',
            timestamp: new Date().toISOString(),
            metric: 'Real-time Tidal Water Level',
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
        summary: `Error in Ocean Intelligence Agent: ${message}`,
        warnings: ['Ocean Agent encountered an execution fault.'],
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

export const oceanAgent = new OceanAgent();
