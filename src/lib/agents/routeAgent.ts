/**
 * ORCA Route Optimization Agent
 * Specialized in risk-aware maritime passage planning, A* waypoint corridors,
 * marine protected area (MPA) geofence avoidance, and sea-state routing.
 * Consumes upstream outputs from Weather, Ocean, Geospatial, Alert, and Risk agents.
 */

import { AgentRole } from '../types';
import { AgentContext, AgentResult, AgentTask, ISpecializedAgent, MapAction } from './interfaces';
import { executeTool } from './tools/registry';
import { SafestRouteResult } from '../routing/routeOptimizer';

export class RouteAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'PLANNER';
  readonly name = 'Route Optimization Agent';
  readonly description = 'Specialized in deterministic safe passage planning, waypoint optimization, and marine sanctuary geofence avoidance.';

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const lat = context.location.latitude;
    const lon = context.location.longitude;

    try {
      // Extract upstream ocean and weather data if available
      const oceanAgentResult = context.previousAgentResults?.['Ocean Intelligence Agent'];
      const weatherAgentResult = context.previousAgentResults?.['Weather Intelligence Agent'];

      const waveH = oceanAgentResult?.structuredData?.waveHeightM as number | undefined;
      const windKmh = weatherAgentResult?.structuredData?.windSpeedKmh as number | undefined;

      const routeToolRes = await executeTool('findSafestRoute', {
        latitude: lat,
        longitude: lon,
        originLat: lat,
        originLon: lon,
        originName: context.location.name,
        waveHeightM: waveH,
        windSpeedKmh: windKmh,
      });

      if (!routeToolRes.success || !routeToolRes.data) {
        return {
          agentName: this.name,
          success: false,
          summary: `Passage routing corridor could not be calculated from ${context.location.name}.`,
          warnings: ['Safe routing engine could not solve passage corridor for given coordinates.'],
          evidence: [],
          provenance: [],
          confidence: 'LOW',
          timestamp: new Date().toISOString(),
          executionTimeMs: Date.now() - startTime,
          error: routeToolRes.error || 'Routing computation failed',
        };
      }

      const route = routeToolRes.data as SafestRouteResult;

      const summary = `Safe Passage Corridor: ${route.origin.name} → ${route.destination.name} (~${route.totalDistanceKm} km / ${route.totalDistanceNM} NM). Risk: ${route.overallRouteRisk}. Waypoints: ${route.waypoints.length}.`;

      const warnings: string[] = [
        ...route.hazardsDetected.map((h: string) => `Hazard Avoidance: Avoided ${h}`),
        ...route.avoidedZones.map((g: string) => `Sanctuary Avoidance: Safely routed around ${g}`),
      ];

      const mapActions: MapAction[] = [
        {
          type: 'SHOW_ROUTE',
          latitude: lat,
          longitude: lon,
          payload: { route },
        },
      ];

      return {
        agentName: this.name,
        success: true,
        summary,
        structuredData: {
          origin: route.origin,
          destination: route.destination,
          totalDistanceKm: route.totalDistanceKm,
          totalDistanceNM: route.totalDistanceNM,
          overallRiskLevel: route.overallRouteRisk,
          overallRouteRisk: route.overallRouteRisk,
          waypoints: route.waypoints,
          hazardsAvoided: route.hazardsDetected,
          hazardsDetected: route.hazardsDetected,
          geofencesAvoided: route.avoidedZones,
          avoidedZones: route.avoidedZones,
          disclaimer: route.disclaimer,
          route,
        },
        evidence: routeToolRes.evidence || [],
        warnings,
        provenance: [
          {
            source: 'ORCA A* Marine Safe Passage Optimizer',
            provider: 'ORCA Navigational Routing Engine v1.0',
            status: 'LIVE',
            timestamp: new Date().toISOString(),
            metric: 'Passage Waypoints & Geofence Avoidance',
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
        summary: `Error in Route Optimization Agent: ${message}`,
        warnings: ['Route Optimization Agent encountered an execution fault.'],
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

export const routeAgent = new RouteAgent();
