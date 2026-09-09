/**
 * ORCA Fishing & Marine Productivity Agent
 * Specialized in Potential Fishing Zones (PFZ demo layer), satellite ocean color chlorophyll-a fronts,
 * and composite sea surface temperature (SST) marine productivity indices.
 * Strictly maintains DEMO honesty: clearly labels PFZ demo layers without claiming live INCOIS feeds.
 */

import { AgentRole, PFZZone } from '../types';
import { AgentContext, AgentResult, AgentTask, ISpecializedAgent, MapAction } from './interfaces';
import { executeTool } from './tools/registry';

export class FishingAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'OCEAN';
  readonly name = 'Fishing & Productivity Agent';
  readonly description = 'Specialized in Potential Fishing Zones (PFZ demo advisories), satellite chlorophyll-a fronts, and composite marine productivity.';

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const lat = context.location.latitude;
    const lon = context.location.longitude;

    try {
      // 1. Query PFZ demo layer
      const pfzToolPromise = executeTool('getPFZ', {
        latitude: lat,
        longitude: lon,
      });

      // 2. Query composite marine productivity
      const prodToolPromise = executeTool('analyzeMarineProductivity', {
        latitude: lat,
        longitude: lon,
      });

      const [pfzRes, prodRes] = await Promise.all([
        pfzToolPromise,
        prodToolPromise,
      ]);

      const pfzData = pfzRes.success ? (pfzRes.data as { zones: PFZZone[]; nearestZone?: PFZZone; disclaimer: string }) : null;
      const prodData = prodRes.success ? (prodRes.data as Record<string, unknown>) : null;

      const nearestPfz = pfzData?.nearestZone;
      const zones = pfzData?.zones || [];

      const summaryParts: string[] = [];
      if (nearestPfz) {
        summaryParts.push(`Identified ${zones.length} DEMO PFZ zone(s). Nearest: ${nearestPfz.name} (~${nearestPfz.distanceFromLocationKm ?? 'N/A'} km)`);
      } else {
        summaryParts.push('PFZ intelligence consulted (DEMO reference layer)');
      }

      if (prodData && typeof prodData.compositeProductivityScore === 'number') {
        summaryParts.push(`Productivity Index: ${prodData.compositeProductivityScore}/100 (${prodData.productivityLevel})`);
      }

      const summary = summaryParts.join(' | ');

      const warnings: string[] = [
        'PFZ advisory is provided as a DEMO prototype layer. For official operational fish catch advisories, consult INCOIS SAMUDRA.',
      ];

      const mapActions: MapAction[] = [];
      if (zones.length > 0) {
        mapActions.push({
          type: 'SHOW_PFZ',
          latitude: lat,
          longitude: lon,
          payload: { zones },
        });
      }

      const evidence = [
        ...(pfzRes.evidence || []),
        ...(prodRes.evidence || []),
      ];

      return {
        agentName: this.name,
        success: true,
        summary,
        structuredData: {
          pfzZones: zones,
          nearestPfzZone: nearestPfz,
          productivity: prodData,
          disclaimer: pfzData?.disclaimer,
        },
        evidence,
        warnings,
        provenance: [
          {
            source: 'ORCA Synthetic Potential Fishing Zone Dataset',
            provider: 'ORCA Fisheries Research Demo Layer',
            status: 'DEMO',
            timestamp: new Date().toISOString(),
            metric: 'PFZ Advisory Coordinates & SST Gradients',
          },
          {
            source: 'Sentinel-3 OLCI / MODIS Aqua Chlorophyll Proxy',
            provider: 'Copernicus Ocean Color Service',
            status: 'DEMO',
            timestamp: new Date().toISOString(),
            metric: 'Chlorophyll-a Concentration & Fronts',
          },
        ],
        mapActions,
        confidence: 'HIGH',
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        agentName: this.name,
        success: false,
        summary: `Error in Fishing & Productivity Agent: ${message}`,
        warnings: ['Fishing & Productivity Agent encountered a processing error.'],
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

export const fishingAgent = new FishingAgent();
