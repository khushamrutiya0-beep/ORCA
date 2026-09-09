/**
 * ORCA Synthesis Agent
 * Final conversational synthesis agent powered by Gemini (with deterministic fallback).
 * Synthesizes grounded, empathetic, role-personalized responses from multi-agent execution results.
 * Strictly non-hallucinatory: cites only structured data and verified evidence supplied by upstream specialized agents.
 */

import { AgentRole, AgentPlan, EvidenceItem, ToolResult } from '../types';
import { AgentContext, AgentResult, AgentTask, ISpecializedAgent, MapAction } from './interfaces';
import { getLLMProvider } from '../llm';

export interface SynthesisInput {
  context: AgentContext;
  plan: AgentPlan;
  agentResults: AgentResult[];
  evidence: EvidenceItem[];
  mapActions?: MapAction[];
}

export class SynthesisAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'SYNTHESIZER';
  readonly name = 'Gemini Synthesis Agent';
  readonly description = 'Specialized in natural language synthesis, multilingual vernacular responses (Hindi, Gujarati, English), and role-tailored explanations.';

  async synthesize(input: SynthesisInput): Promise<{
    answer: string;
    mapActions: MapAction[];
    executionSummary: string[];
  }> {
    const { context, plan, agentResults, evidence } = input;
    const provider = getLLMProvider();

    // Map AgentResult[] back into ToolResult[] format for ILLMProvider synthesis
    const toolResults: ToolResult[] = [];
    const executionSummary: string[] = [];
    const mapActions: MapAction[] = [...(input.mapActions || [])];

    for (const result of agentResults) {
      executionSummary.push(`✓ ${result.agentName} (${result.executionTimeMs ?? 0}ms)`);

      if (result.mapActions) {
        mapActions.push(...result.mapActions);
      }

      if (result.structuredData) {
        // Synthesize corresponding ToolResult records for backward compatibility
        if (result.agentName === 'Weather Intelligence Agent') {
          toolResults.push({
            tool: 'getWeather',
            success: result.success,
            data: result.structuredData.rawObservation,
            retrievedAt: result.timestamp,
            sourceAttribution: 'Open-Meteo Weather API',
            evidence: result.evidence,
          });
        } else if (result.agentName === 'Ocean Intelligence Agent') {
          toolResults.push({
            tool: 'getMarineConditions',
            success: result.success,
            data: result.structuredData.rawObservation,
            retrievedAt: result.timestamp,
            sourceAttribution: 'Open-Meteo Marine API',
            evidence: result.evidence,
          });
        } else if (result.agentName === 'Geospatial Intelligence Agent') {
          if (result.structuredData.nearestPort) {
            toolResults.push({
              tool: 'findNearestPort',
              success: result.success,
              data: result.structuredData.nearestPort,
              retrievedAt: result.timestamp,
              sourceAttribution: 'ORCA Geospatial Engine',
              evidence: result.evidence,
            });
          }
          if (result.structuredData.geofences) {
            toolResults.push({
              tool: 'getGeofences',
              success: result.success,
              data: {
                zones: result.structuredData.geofences,
                insideProhibitedZone: result.structuredData.insideProhibitedZone,
              },
              retrievedAt: result.timestamp,
              sourceAttribution: 'MoEFCC MPAs Database',
              evidence: result.evidence,
            });
          }
        } else if (result.agentName === 'Marine Risk & Safety Agent') {
          toolResults.push({
            tool: 'assessMarineRisk',
            success: result.success,
            data: result.structuredData.rawAssessment,
            retrievedAt: result.timestamp,
            sourceAttribution: 'ORCA Deterministic Risk Engine',
            evidence: result.evidence,
          });
        } else if (result.agentName === 'Alert & Disaster Agent') {
          toolResults.push({
            tool: 'getMarineAlerts',
            success: result.success,
            data: {
              alerts: result.structuredData.alerts,
              liveProviders: result.structuredData.liveProviders,
              unavailableProviders: result.structuredData.unavailableProviders,
            },
            retrievedAt: result.timestamp,
            sourceAttribution: 'GDACS (UN OCHA / JRC)',
            evidence: result.evidence,
          });
        } else if (result.agentName === 'Fishing & Productivity Agent') {
          if (result.structuredData.pfzZones) {
            toolResults.push({
              tool: 'getPFZ',
              success: result.success,
              data: {
                zones: result.structuredData.pfzZones,
                nearestZone: result.structuredData.nearestPfzZone,
                disclaimer: result.structuredData.disclaimer,
              },
              retrievedAt: result.timestamp,
              sourceAttribution: 'ORCA Synthetic PFZ Dataset (DEMO)',
              evidence: result.evidence,
            });
          }
          if (result.structuredData.productivity) {
            toolResults.push({
              tool: 'analyzeMarineProductivity',
              success: result.success,
              data: result.structuredData.productivity,
              retrievedAt: result.timestamp,
              sourceAttribution: 'ORCA Marine Productivity Index (DEMO)',
              evidence: result.evidence,
            });
          }
        } else if (result.agentName === 'Historical Analysis Agent') {
          toolResults.push({
            tool: 'analyzeHistoricalMarineConditions',
            success: result.success,
            data: result.structuredData,
            retrievedAt: result.timestamp,
            sourceAttribution: 'ORCA Climatological Baseline',
            evidence: result.evidence,
          });
        } else if (result.agentName === 'Route Optimization Agent') {
          toolResults.push({
            tool: 'findSafestRoute',
            success: result.success,
            data: result.structuredData,
            retrievedAt: result.timestamp,
            sourceAttribution: 'ORCA A* Safe Passage Optimizer',
            evidence: result.evidence,
          });
        }
      }
    }

    // Call synthesis layer
    const answer = await provider.synthesizeResponse({
      originalMessage: context.userMessage,
      plan,
      toolResults,
      detectedLanguage: context.detectedLanguage,
      conversationState: context.conversationState,
    });

    return {
      answer,
      mapActions,
      executionSummary,
    };
  }

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const agentResultsList = Object.values(context.previousAgentResults || {});

    const synthResult = await this.synthesize({
      context,
      plan: {
        intent: 'MARINE_SAFETY_ASSESSMENT',
        location: context.location,
        time: context.timeRange,
        requiredTools: [],
        steps: [],
        detectedLanguage: context.detectedLanguage,
        userPersona: context.userRole,
        vesselContext: context.vesselProfile,
      },
      agentResults: agentResultsList,
      evidence: [],
    });

    return {
      agentName: this.name,
      success: true,
      summary: synthResult.answer,
      evidence: [],
      warnings: [],
      provenance: [],
      mapActions: synthResult.mapActions,
      confidence: 'HIGH',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export const synthesisAgent = new SynthesisAgent();
