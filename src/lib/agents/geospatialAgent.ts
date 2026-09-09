/**
 * ORCA Geospatial Intelligence Agent
 * Specialized in Indian coastal topology, maritime port proximity, marine protected areas (MPAs),
 * international maritime boundary lines (IMBL), and map interaction directives.
 */

import { AgentRole, NearestPortInfo, GeoRestriction, EvidenceItem } from '../types';
import { AgentContext, AgentResult, AgentTask, ISpecializedAgent, MapAction } from './interfaces';
import { executeTool } from './tools/registry';

export class GeospatialAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'GEOSPATIAL';
  readonly name = 'Geospatial Intelligence Agent';
  readonly description = 'Specialized in Indian coastal geography, port distances, marine protected areas, geofencing, and map visualization actions.';

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const lat = context.location.latitude;
    const lon = context.location.longitude;

    try {
      // 1. Find nearest coastal port
      const portToolPromise = executeTool('findNearestPort', {
        latitude: lat,
        longitude: lon,
      });

      // 2. Query nearby marine geofences (MPAs, coral reefs, sanctuaries)
      const geofenceToolPromise = executeTool('getGeofences', {
        latitude: lat,
        longitude: lon,
      });

      const [portRes, geofenceRes] = await Promise.all([
        portToolPromise,
        geofenceToolPromise,
      ]);

      const port = portRes.success ? (portRes.data as NearestPortInfo) : null;
      const rawGeo = geofenceRes.success ? (geofenceRes.data as { isRestricted: boolean; insideZones: GeoRestriction[]; nearbyZones: GeoRestriction[]; warnings: string[] }) : null;
      const allZones = [...(rawGeo?.insideZones || []), ...(rawGeo?.nearbyZones || [])];
      const isInside = !!(rawGeo?.insideZones && rawGeo.insideZones.length > 0);

      const summaryParts: string[] = [];
      if (port) {
        summaryParts.push(`Nearest Port: ${port.portName} (~${port.distanceKm} km / ${port.distanceNM} NM)`);
      }
      if (isInside) {
        summaryParts.push('ALERT: Located INSIDE a protected marine sanctuary / prohibited zone');
      } else if (allZones.length > 0) {
        summaryParts.push(`Identified ${allZones.length} nearby marine protected/sensitive zones`);
      }

      const summary = summaryParts.length > 0
        ? summaryParts.join(' | ')
        : `Spatial coordinates resolved: ${context.location.name} (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;

      const warnings: string[] = [];
      if (isInside) {
        warnings.push(`Vessel is inside a restricted Marine Protected Area (MPA) or National Park. Fishing/anchoring may be legally prohibited.`);
      }

      const mapActions: MapAction[] = [
        {
          type: 'FLY_TO',
          latitude: lat,
          longitude: lon,
          zoom: 10,
        },
      ];

      if (allZones.length > 0) {
        mapActions.push({
          type: 'SHOW_GEOFENCE',
          latitude: lat,
          longitude: lon,
          payload: { zones: allZones },
        });
      }

      const evidence: EvidenceItem[] = [];
      if (port) {
        evidence.push({
          id: `ev-port-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          provider: 'ORCA Geospatial Engine',
          source: portRes.sourceAttribution || 'ORCA Indian Coastal Ports Reference Database',
          timestamp: portRes.retrievedAt || new Date().toISOString(),
          status: 'LIVE',
          dataType: 'GEOSPATIAL',
          summary: `Nearest port: ${port.portName}, Distance: ${port.distanceKm} km / ${port.distanceNM} NM`,
          rawMetrics: {
            portName: port.portName,
            state: port.state,
            distanceKm: port.distanceKm,
            distanceNM: port.distanceNM,
            coordinates: port.coordinates,
          },
        });
      }
      if (geofenceRes.evidence) {
        evidence.push(...geofenceRes.evidence);
      }

      return {
        agentName: this.name,
        success: true,
        summary,
        structuredData: {
          locationName: context.location.name,
          latitude: lat,
          longitude: lon,
          nearestPort: port,
          geofences: allZones,
          insideProhibitedZone: isInside,
        },
        evidence,
        warnings,
        provenance: [
          {
            source: 'ORCA Indian Coastal Ports Database',
            provider: 'ORCA Geospatial Reference Engine',
            status: 'LIVE',
            timestamp: new Date().toISOString(),
            metric: 'Port Proximity & Distance',
          },
          {
            source: 'MoEFCC / Wildlife Institute of India MPAs',
            provider: 'ORCA Marine Protected Area Registry',
            status: 'LIVE',
            timestamp: new Date().toISOString(),
            metric: 'Geofenced Marine Sanctuaries',
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
        summary: `Error in Geospatial Intelligence Agent: ${message}`,
        warnings: ['Geospatial Agent encountered a coordinate evaluation issue.'],
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

export const geospatialAgent = new GeospatialAgent();
