/**
 * ORCA Risk Assessment Tool
 * Calls the existing ORCARiskEngine.assessMarineRisk() from Milestone 3.
 * The LLM NEVER calculates risk — this is a 100% deterministic TypeScript computation.
 */

import { ToolResult, OceanObservation, WeatherObservation } from '../../types';
import { NearestPortInfo } from '../../types/risk';
import { orcaRiskEngine } from '../../risk/riskEngine';
import { ToolInput } from './registry';

export async function executeRiskTool(input: ToolInput): Promise<ToolResult> {
  try {
    const weather = input.weatherData as WeatherObservation | undefined;
    const ocean = input.oceanData as OceanObservation | undefined;
    const nearestPort = input.nearestPort as NearestPortInfo | undefined;

    const assessment = orcaRiskEngine.assessMarineRisk({
      coordinates: { latitude: input.latitude, longitude: input.longitude },
      targetTimeIso: input.timeIso,
      timeLabel: input.timeLabel,
      weatherObservation: weather ?? null,
      oceanObservation: ocean ?? null,
      nearestPort,
    });

    return {
      tool: 'assessMarineRisk',
      success: true,
      data: assessment,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'ORCA Deterministic Risk Engine v0.3.0 (WMO/Beaufort criteria)',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tool: 'assessMarineRisk',
      success: false,
      error: message,
      retrievedAt: new Date().toISOString(),
      sourceAttribution: 'ORCA Risk Engine',
    };
  }
}
