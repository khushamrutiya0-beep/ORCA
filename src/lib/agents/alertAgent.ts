/**
 * ORCA Alert & Disaster Intelligence Agent
 * Specialized in tropical cyclone monitoring, GDACS international disaster alerts, storm surge warnings,
 * and coastal hazard advisories.
 */

import { AgentRole } from '../types';
import { AgentContext, AgentResult, AgentTask, ISpecializedAgent, MapAction } from './interfaces';
import { executeTool } from './tools/registry';

export class AlertAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'RISK';
  readonly name = 'Alert & Disaster Agent';
  readonly description = 'Specialized in tropical cyclones, storm surge warnings, GDACS live disaster feeds, and coastal hazard advisories.';

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const lat = context.location.latitude;
    const lon = context.location.longitude;

    try {
      const alertToolRes = await executeTool('getMarineAlerts', {
        latitude: lat,
        longitude: lon,
      });

      if (!alertToolRes.success || !alertToolRes.data) {
        return {
          agentName: this.name,
          success: false,
          summary: `Disaster alert telemetry is currently unavailable for ${context.location.name}.`,
          warnings: ['Alert feed could not connect to international disaster monitoring services.'],
          evidence: [],
          provenance: [
            {
              source: 'GDACS (Global Disaster Alert and Coordination System)',
              provider: 'UN OCHA / Joint Research Centre',
              status: 'UNAVAILABLE',
              timestamp: new Date().toISOString(),
            },
          ],
          confidence: 'LOW',
          timestamp: new Date().toISOString(),
          executionTimeMs: Date.now() - startTime,
          error: alertToolRes.error || 'Alert retrieval failed',
        };
      }

      const alertData = alertToolRes.data as {
        alerts: Array<{
          id: string;
          type: string;
          severity: string;
          title: string;
          description: string;
          source: string;
          issuedAt: string;
          affectedArea?: string;
        }>;
        liveProviders: string[];
        unavailableProviders: string[];
      };

      const alerts = alertData.alerts || [];
      const activeCount = alerts.length;

      const summary = activeCount > 0
        ? `🚨 ${activeCount} active maritime hazard alert(s) detected near ${context.location.name}.`
        : `✅ No active cyclone, storm surge, or extreme disaster warnings in effect for ${context.location.name}.`;

      const warnings: string[] = [];
      for (const alert of alerts) {
        warnings.push(`[${alert.severity}] ${alert.title}: ${alert.description}`);
      }

      const mapActions: MapAction[] = [];
      if (activeCount > 0) {
        mapActions.push({
          type: 'SHOW_ALERT',
          latitude: lat,
          longitude: lon,
          payload: { alerts },
        });
      }

      return {
        agentName: this.name,
        success: true,
        summary,
        structuredData: {
          activeAlertCount: activeCount,
          alerts,
          liveProviders: alertData.liveProviders,
          unavailableProviders: alertData.unavailableProviders,
        },
        evidence: alertToolRes.evidence || [],
        warnings,
        provenance: [
          {
            source: 'GDACS (UN OCHA / European Commission JRC)',
            provider: 'Global Disaster Alert and Coordination System',
            status: 'LIVE',
            timestamp: new Date().toISOString(),
            metric: 'Live Cyclone & Disaster Alerts',
          },
          {
            source: 'IMD National Cyclone Bulletin Stream',
            provider: 'India Meteorological Department (MoES)',
            status: 'UNAVAILABLE',
            timestamp: new Date().toISOString(),
            metric: 'Official Ministerial IMD Bulletins',
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
        summary: `Error in Alert & Disaster Agent: ${message}`,
        warnings: ['Alert agent encountered an execution error.'],
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

export const alertAgent = new AlertAgent();
