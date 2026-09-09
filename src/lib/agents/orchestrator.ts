/**
 * ORCA Multi-Agent Orchestrator
 * Coordinates true collaborative multi-agent execution across specialized intelligence agents.
 * 
 * Pipeline:
 *   User Query
 *     ↓
 *   Planner Agent (Task Graph & Phase Decomposition)
 *     ↓
 *   Phase 1: Parallel Independent Agents (Weather, Ocean, Geospatial, Alert, Fishing, Historical)
 *     ↓
 *   Phase 2: Marine Risk & Safety Agent (Deterministic ORCA Risk Engine)
 *     ↓
 *   Phase 3: Route Optimization Agent (A* Passage Planning & Geofence Avoidance)
 *     ↓
 *   Evidence Agent (Provenance Validation & Grounding)
 *     ↓
 *   Synthesis Agent (Gemini Vernacular & Role-Aware Response)
 */

import { 
  AgentPlan, 
  AgentResponse, 
  AgentStep, 
  ConversationState, 
  DetectedLanguage, 
  EvidenceItem, 
  MapContext, 
  ToolResult, 
  UserPersona 
} from '../types';
import { AgentContext, AgentResult, ISpecializedAgent } from './interfaces';
import { plannerAgent } from './plannerAgent';
import { weatherAgent } from './weatherAgent';
import { oceanAgent } from './oceanAgent';
import { geospatialAgent } from './geospatialAgent';
import { riskAgent } from './riskAgent';
import { alertAgent } from './alertAgent';
import { fishingAgent } from './fishingAgent';
import { historicalAgent } from './historicalAgent';
import { routeAgent } from './routeAgent';
import { evidenceAgent } from './evidenceAgent';
import { synthesisAgent } from './synthesisAgent';
import { updateConversationState, sanitizeConversationState } from './conversationContext';
import { executeTool, ALLOWLISTED_TOOLS } from './tools/registry';
import { RiskAssessment, NearestPortInfo } from '../types/risk';
import { OceanObservation, WeatherObservation } from '../types/marine';

export interface MultiAgentExecutionResult {
  answer: string;
  plan: AgentPlan;
  agentResults: AgentResult[];
  toolResults: ToolResult[];
  evidence: EvidenceItem[];
  riskAssessment?: RiskAssessment;
  mapContext: MapContext;
  conversationState: ConversationState;
  suggestedQuestions: string[];
  executionSteps: AgentStep[];
  processingTimeMs: number;
}

export class AgentOrchestrator {
  private agentRegistry: Map<string, ISpecializedAgent> = new Map();

  constructor() {
    this.registerAgent(weatherAgent);
    this.registerAgent(oceanAgent);
    this.registerAgent(geospatialAgent);
    this.registerAgent(riskAgent);
    this.registerAgent(alertAgent);
    this.registerAgent(fishingAgent);
    this.registerAgent(historicalAgent);
    this.registerAgent(routeAgent);
    this.registerAgent(evidenceAgent);
    this.registerAgent(synthesisAgent);
  }

  private registerAgent(agent: ISpecializedAgent) {
    this.agentRegistry.set(agent.name, agent);
  }

  /**
   * Execute the full true collaborative multi-agent workflow.
   */
  async runCollaborativePipeline(params: {
    message: string;
    conversationState?: ConversationState;
    detectedLanguage: DetectedLanguage;
    userRole?: UserPersona;
  }): Promise<MultiAgentExecutionResult> {
    const startTime = Date.now();
    const { message, conversationState, detectedLanguage, userRole } = params;

    // 1. Planner Agent analyzes intent and constructs multi-agent plan
    const multiPlan = await plannerAgent.plan({
      message,
      conversationState,
      detectedLanguage,
      userRole,
    });

    const plan = multiPlan.plan;
    const completedAgentResults: Record<string, AgentResult> = {};
    const executionSteps: AgentStep[] = [];

    // Base context shared by all agents
    const baseContext: AgentContext = {
      userMessage: message,
      userRole: plan.userPersona || 'FISHERMAN',
      detectedLanguage,
      conversationState,
      location: plan.location,
      timeRange: plan.time,
      vesselProfile: plan.vesselContext,
      previousAgentResults: completedAgentResults,
    };

    // Phase 1: Run independent specialized intelligence agents in parallel
    const phase1Agents = multiPlan.executionPhases.find((p) => p.phase === 1)?.agentNames || [];
    const phase1Promises = phase1Agents.map(async (agentName) => {
      const agent = this.agentRegistry.get(agentName);
      if (!agent) return null;
      try {
        const result = await agent.execute(baseContext);
        return { agentName, result };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          agentName,
          result: {
            agentName,
            success: false,
            summary: `Execution fault: ${msg}`,
            warnings: [`${agentName} failed gracefully`],
            evidence: [],
            provenance: [],
            confidence: 'LOW' as const,
            timestamp: new Date().toISOString(),
            error: msg,
          },
        };
      }
    });

    const phase1Results = await Promise.all(phase1Promises);
    for (const item of phase1Results) {
      if (item) {
        completedAgentResults[item.agentName] = item.result;
        const agentInstance = this.agentRegistry.get(item.agentName);
        executionSteps.push({
          agentRole: agentInstance?.role || 'WEATHER',
          stepName: item.agentName,
          status: item.result.success ? 'COMPLETED' : 'SKIPPED',
          outputSummary: item.result.summary,
          durationMs: item.result.executionTimeMs,
        });
      }
    }

    // Update context with Phase 1 results for downstream agents
    baseContext.previousAgentResults = { ...completedAgentResults };

    // Phase 2: Marine Risk & Safety Agent (Deterministic ORCA Risk Engine)
    const hasRisk = multiPlan.executionPhases.some((p) => p.phase === 2);
    if (hasRisk) {
      const riskAgentInstance = this.agentRegistry.get('Marine Risk & Safety Agent');
      if (riskAgentInstance) {
        try {
          const riskResult = await riskAgentInstance.execute(baseContext);
          completedAgentResults['Marine Risk & Safety Agent'] = riskResult;
          executionSteps.push({
            agentRole: 'RISK',
            stepName: 'Marine Risk & Safety Agent',
            status: riskResult.success ? 'COMPLETED' : 'SKIPPED',
            outputSummary: riskResult.summary,
            durationMs: riskResult.executionTimeMs,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          completedAgentResults['Marine Risk & Safety Agent'] = {
            agentName: 'Marine Risk & Safety Agent',
            success: false,
            summary: `Risk evaluation fault: ${msg}`,
            warnings: ['Marine Risk Agent failed gracefully.'],
            evidence: [],
            provenance: [],
            confidence: 'LOW',
            timestamp: new Date().toISOString(),
            error: msg,
          };
        }
      }
    }

    // Update context for Phase 3
    baseContext.previousAgentResults = { ...completedAgentResults };

    // Phase 3: Route Optimization Agent (A* Passage Planning)
    const hasRoute = multiPlan.executionPhases.some((p) => p.phase === 3);
    if (hasRoute) {
      const routeAgentInstance = this.agentRegistry.get('Route Optimization Agent');
      if (routeAgentInstance) {
        try {
          const routeResult = await routeAgentInstance.execute(baseContext);
          completedAgentResults['Route Optimization Agent'] = routeResult;
          executionSteps.push({
            agentRole: 'PLANNER',
            stepName: 'Route Optimization Agent',
            status: routeResult.success ? 'COMPLETED' : 'SKIPPED',
            outputSummary: routeResult.summary,
            durationMs: routeResult.executionTimeMs,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          completedAgentResults['Route Optimization Agent'] = {
            agentName: 'Route Optimization Agent',
            success: false,
            summary: `Route planning fault: ${msg}`,
            warnings: ['Route Agent failed gracefully.'],
            evidence: [],
            provenance: [],
            confidence: 'LOW',
            timestamp: new Date().toISOString(),
            error: msg,
          };
        }
      }
    }

    // Phase 4: Evidence Agent Aggregation
    const agentResultsList = Object.values(completedAgentResults);
    const evidence = evidenceAgent.collectFromAgentResults(agentResultsList);

    // Phase 5: Synthesis Agent (Gemini Grounded Synthesis)
    const synthResult = await synthesisAgent.synthesize({
      context: baseContext,
      plan,
      agentResults: agentResultsList,
      evidence,
    });

    // Build legacy tool results for backwards compatibility
    const toolResults = this.deriveToolResults(completedAgentResults);

    // Extract risk assessment
    const riskAssessment = completedAgentResults['Marine Risk & Safety Agent']?.structuredData
      ?.rawAssessment as RiskAssessment | undefined;

    // Build Map Context
    const mapContext: MapContext = {
      updateMap: plan.location.resolvedFrom !== 'DEFAULT',
      coordinates: { latitude: plan.location.latitude, longitude: plan.location.longitude },
      locationName: plan.location.name,
      riskLevel: riskAssessment?.riskLevel,
      centerMap: plan.location.resolvedFrom === 'CITY_LOOKUP',
    };

    // Update Conversation State
    const updatedConversationState = updateConversationState(
      conversationState || sanitizeConversationState(undefined),
      plan,
      toolResults
    );

    const processingTimeMs = Date.now() - startTime;

    return {
      answer: synthResult.answer,
      plan,
      agentResults: agentResultsList,
      toolResults,
      evidence,
      riskAssessment,
      mapContext,
      conversationState: updatedConversationState,
      suggestedQuestions: updatedConversationState.suggestedFollowUps || [],
      executionSteps,
      processingTimeMs,
    };
  }

  /**
   * Derive legacy ToolResult[] from AgentResult[] for full backwards compatibility.
   */
  private deriveToolResults(agentResultsMap: Record<string, AgentResult>): ToolResult[] {
    const toolResults: ToolResult[] = [];

    for (const [agentName, res] of Object.entries(agentResultsMap)) {
      if (!res.structuredData) continue;

      if (agentName === 'Weather Intelligence Agent' && res.structuredData.rawObservation) {
        toolResults.push({
          tool: 'getWeather',
          success: res.success,
          data: res.structuredData.rawObservation,
          retrievedAt: res.timestamp,
          sourceAttribution: 'Open-Meteo Weather API',
          evidence: res.evidence,
        });
      }

      if (agentName === 'Ocean Intelligence Agent' && res.structuredData.rawObservation) {
        toolResults.push({
          tool: 'getMarineConditions',
          success: res.success,
          data: res.structuredData.rawObservation,
          retrievedAt: res.timestamp,
          sourceAttribution: 'Open-Meteo Marine API',
          evidence: res.evidence,
        });
        if (res.structuredData.tideContext) {
          toolResults.push({
            tool: 'getTide',
            success: true,
            data: res.structuredData.tideContext,
            retrievedAt: res.timestamp,
            sourceAttribution: 'Survey of India / INCOIS Tide Gauges',
          });
        }
        if (res.structuredData.chlorophyllContext) {
          toolResults.push({
            tool: 'getChlorophyll',
            success: true,
            data: res.structuredData.chlorophyllContext,
            retrievedAt: res.timestamp,
            sourceAttribution: 'Copernicus Sentinel-3 OLCI Proxy',
          });
        }
      }

      if (agentName === 'Geospatial Intelligence Agent') {
        if (res.structuredData.nearestPort) {
          toolResults.push({
            tool: 'findNearestPort',
            success: res.success,
            data: res.structuredData.nearestPort,
            retrievedAt: res.timestamp,
            sourceAttribution: 'ORCA Geospatial Engine',
            evidence: res.evidence,
          });
        }
        if (res.structuredData.geofences) {
          toolResults.push({
            tool: 'getGeofences',
            success: res.success,
            data: {
              zones: res.structuredData.geofences,
              insideProhibitedZone: res.structuredData.insideProhibitedZone,
            },
            retrievedAt: res.timestamp,
            sourceAttribution: 'MoEFCC MPAs Database',
            evidence: res.evidence,
          });
        }
      }

      if (agentName === 'Marine Risk & Safety Agent' && res.structuredData.rawAssessment) {
        toolResults.push({
          tool: 'assessMarineRisk',
          success: res.success,
          data: res.structuredData.rawAssessment,
          retrievedAt: res.timestamp,
          sourceAttribution: 'ORCA Deterministic Risk Engine',
          evidence: res.evidence,
        });
      }

      if (agentName === 'Alert & Disaster Agent') {
        toolResults.push({
          tool: 'getMarineAlerts',
          success: res.success,
          data: {
            alerts: res.structuredData.alerts,
            liveProviders: res.structuredData.liveProviders,
            unavailableProviders: res.structuredData.unavailableProviders,
          },
          retrievedAt: res.timestamp,
          sourceAttribution: 'GDACS (UN OCHA / JRC)',
          evidence: res.evidence,
        });
      }

      if (agentName === 'Fishing & Productivity Agent') {
        if (res.structuredData.pfzZones) {
          toolResults.push({
            tool: 'getPFZ',
            success: res.success,
            data: {
              zones: res.structuredData.pfzZones,
              nearestZone: res.structuredData.nearestPfzZone,
              disclaimer: res.structuredData.disclaimer,
            },
            retrievedAt: res.timestamp,
            sourceAttribution: 'ORCA Synthetic PFZ Dataset (DEMO)',
            evidence: res.evidence,
          });
        }
        if (res.structuredData.productivity) {
          toolResults.push({
            tool: 'analyzeMarineProductivity',
            success: res.success,
            data: res.structuredData.productivity,
            retrievedAt: res.timestamp,
            sourceAttribution: 'ORCA Marine Productivity Index (DEMO)',
            evidence: res.evidence,
          });
        }
      }

      if (agentName === 'Historical Analysis Agent') {
        toolResults.push({
          tool: 'analyzeHistoricalMarineConditions',
          success: res.success,
          data: res.structuredData,
          retrievedAt: res.timestamp,
          sourceAttribution: 'ORCA Climatological Baseline',
          evidence: res.evidence,
        });
      }

      if (agentName === 'Route Optimization Agent') {
        toolResults.push({
          tool: 'findSafestRoute',
          success: res.success,
          data: res.structuredData,
          retrievedAt: res.timestamp,
          sourceAttribution: 'ORCA A* Safe Passage Optimizer',
          evidence: res.evidence,
        });
      }
    }

    return toolResults;
  }

  /**
   * Legacy execution method preserving 100% backward compatibility for existing callers.
   */
  async execute(plan: AgentPlan): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    const lat = plan.location.latitude;
    const lon = plan.location.longitude;
    const timeIso = plan.time.isoString;
    const timeLabel = plan.time.label;

    const validTools = plan.requiredTools.filter((t) => ALLOWLISTED_TOOLS.includes(t));

    // Phase 1: Parallel-safe independent tools
    const parallelTools = validTools.filter((t) =>
      [
        'getLocationContext',
        'getWeather',
        'getMarineConditions',
        'findNearestPort',
        'getMarineAlerts',
        'getPFZ',
        'getDataSourceStatus',
        'getTide',
        'getChlorophyll',
        'getGeofences',
        'analyzeHistoricalMarineConditions',
      ].includes(t)
    );

    const parallelPromises = parallelTools.map((toolName) =>
      executeTool(toolName, { latitude: lat, longitude: lon, timeIso })
    );

    const parallelResults = await Promise.all(parallelPromises);
    results.push(...parallelResults);

    // Phase 2: Risk assessment (depends on weather + marine data)
    if (validTools.includes('assessMarineRisk')) {
      const weatherResult = results.find((r) => r.tool === 'getWeather');
      const marineResult = results.find((r) => r.tool === 'getMarineConditions');
      const portResult = results.find((r) => r.tool === 'findNearestPort');

      const riskResult = await executeTool('assessMarineRisk', {
        latitude: lat,
        longitude: lon,
        timeIso,
        timeLabel,
        weatherData: weatherResult?.success ? weatherResult.data : undefined,
        oceanData: marineResult?.success ? marineResult.data : undefined,
        nearestPort: portResult?.success ? portResult.data : undefined,
      });
      results.push(riskResult);
    }

    // Phase 3: Marine Productivity Analysis
    if (validTools.includes('analyzeMarineProductivity')) {
      const marineResult = results.find((r) => r.tool === 'getMarineConditions');
      const liveOcean = marineResult?.data as OceanObservation | undefined;
      const sst = liveOcean?.seaSurfaceTemperature?.value ?? undefined;

      const prodResult = await executeTool('analyzeMarineProductivity', {
        latitude: lat,
        longitude: lon,
        liveSstValue: typeof sst === 'number' ? sst : undefined,
      });
      results.push(prodResult);
    }

    // Phase 4: Route Optimization
    if (validTools.includes('findSafestRoute')) {
      const marineResult = results.find((r) => r.tool === 'getMarineConditions');
      const weatherResult = results.find((r) => r.tool === 'getWeather');
      const liveOcean = marineResult?.data as OceanObservation | undefined;
      const liveWeather = weatherResult?.data as WeatherObservation | undefined;

      const routeResult = await executeTool('findSafestRoute', {
        latitude: lat,
        longitude: lon,
        originLat: lat,
        originLon: lon,
        originName: plan.location.name,
        waveHeightM: liveOcean?.waveHeight?.value ?? undefined,
        windSpeedKmh: liveWeather?.windSpeed?.value ?? undefined,
      });
      results.push(routeResult);
    }

    return results;
  }
}

export const agentOrchestrator = new AgentOrchestrator();
