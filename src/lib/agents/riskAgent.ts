/**
 * ORCA Marine Risk & Safety Agent
 * Evaluates marine safety using the deterministic ORCA Risk Engine as the sole mathematical ground truth.
 * Consumes upstream outputs from Weather, Ocean, Geospatial, and Vessel context.
 * Strictly deterministic: NEVER allows LLMs or generative models to calculate the risk score.
 */

import { AgentRole, RiskAssessment, WeatherObservation, OceanObservation, NearestPortInfo } from '../types';
import { AgentContext, AgentResult, AgentTask, ISpecializedAgent } from './interfaces';
import { executeTool } from './tools/registry';

export class RiskAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'RISK';
  readonly name = 'Marine Risk & Safety Agent';
  readonly description = 'Specialized in deterministic marine safety assessment, Beaufort wave/wind risk modeling, and vessel category advisories.';

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const lat = context.location.latitude;
    const lon = context.location.longitude;
    const timeIso = context.timeRange.isoString;
    const timeLabel = context.timeRange.label;

    try {
      // Extract upstream data if provided in previousAgentResults
      const weatherAgentResult = context.previousAgentResults?.['Weather Intelligence Agent'];
      const oceanAgentResult = context.previousAgentResults?.['Ocean Intelligence Agent'];
      const geospatialAgentResult = context.previousAgentResults?.['Geospatial Intelligence Agent'];

      const weatherData = weatherAgentResult?.structuredData?.rawObservation as WeatherObservation | undefined;
      const oceanData = oceanAgentResult?.structuredData?.rawObservation as OceanObservation | undefined;
      const nearestPort = geospatialAgentResult?.structuredData?.nearestPort as NearestPortInfo | undefined;

      // Execute deterministic ORCA Risk Engine tool
      const riskToolRes = await executeTool('assessMarineRisk', {
        latitude: lat,
        longitude: lon,
        timeIso,
        timeLabel,
        weatherData,
        oceanData,
        nearestPort,
      });

      if (!riskToolRes.success || !riskToolRes.data) {
        return {
          agentName: this.name,
          success: false,
          summary: `Safety risk assessment could not be computed for ${context.location.name} (DATA_UNAVAILABLE).`,
          warnings: ['Deterministic risk engine could not execute due to missing telemetry.'],
          evidence: [],
          provenance: [
            {
              source: 'ORCA Deterministic Risk Engine',
              provider: 'ORCA Safety Model v1.0',
              status: 'UNAVAILABLE',
              timestamp: new Date().toISOString(),
            },
          ],
          confidence: 'LOW',
          timestamp: new Date().toISOString(),
          executionTimeMs: Date.now() - startTime,
          error: riskToolRes.error || 'Risk calculation failed',
        };
      }

      const risk = riskToolRes.data as RiskAssessment;

      // Vessel specific customization
      const vessel = context.vesselProfile?.vesselType || 'Standard motorized craft';
      const summary = `Safety Evaluation: ${risk.riskLevel} RISK (Score: ${risk.riskScore}/100, Safety Index: ${risk.safetyScore}%). Recommendation: ${risk.recommendation}`;

      const warnings: string[] = [...risk.warnings];
      if (context.vesselProfile?.lengthMeters && context.vesselProfile.lengthMeters < 8 && risk.vesselAdvisory.smallCraftCaution) {
        warnings.push(`Small boat warning (<8m): Heightened instability risk in current sea state for your ${context.vesselProfile.lengthMeters}m vessel.`);
      }

      return {
        agentName: this.name,
        success: true,
        summary,
        structuredData: {
          riskLevel: risk.riskLevel,
          riskScore: risk.riskScore,
          safetyScore: risk.safetyScore,
          recommendation: risk.recommendation,
          vesselAdvisory: risk.vesselAdvisory,
          factors: risk.factors,
          nearestPort: risk.nearestPort,
          disclaimer: risk.disclaimer,
          rawAssessment: risk,
        },
        evidence: risk.evidence || riskToolRes.evidence || [],
        warnings,
        provenance: [
          {
            source: 'ORCA Deterministic Marine Safety Model',
            provider: 'ORCA Deterministic Risk Engine v1.0',
            status: 'LIVE',
            timestamp: risk.generatedAt || new Date().toISOString(),
            metric: 'Risk Score, Safety Index, Vessel Advisory',
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
        summary: `Error in Marine Risk Agent: ${message}`,
        warnings: ['Risk assessment agent encountered a calculation fault.'],
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

export const riskAgent = new RiskAgent();
