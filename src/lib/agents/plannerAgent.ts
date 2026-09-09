/**
 * ORCA Multi-Agent Planner Agent
 * Analyzes natural language input, resolves conversational context, detects user persona and vessel parameters,
 * and constructs an executable multi-agent dependency task graph.
 * Strictly non-hallucinatory: establishes task orchestration plans without fabricating data.
 */

import { 
  AgentPlan, 
  AgentRole, 
  AgentStep, 
  ConversationState, 
  DetectedLanguage, 
  ResolvedLocation, 
  ResolvedTime, 
  ToolName, 
  UserIntent, 
  UserPersona 
} from '../types';
import { AgentContext, AgentTask, ISpecializedAgent, AgentResult } from './interfaces';
import { getTomorrowMorningIso } from '../risk/timeWindows';
import { COASTAL_CITY_LOOKUP } from './tools/locationTool';
import { extractVesselContext, detectUserRole } from './conversationContext';
import { getLLMProvider } from '../llm';

export interface MultiAgentPlan {
  plan: AgentPlan;
  tasks: AgentTask[];
  requiredSpecializedAgents: string[];
  executionPhases: Array<{
    phase: number;
    description: string;
    agentNames: string[];
  }>;
}

export class PlannerAgent implements ISpecializedAgent {
  readonly role: AgentRole = 'PLANNER';
  readonly name = 'Planner Agent';
  readonly description = 'Specialized in natural language understanding, multi-turn context resolution, task decomposition, and multi-agent dependency graphing.';

  /**
   * Decompose user query into multi-agent task graph.
   */
  async plan(params: {
    message: string;
    conversationState?: ConversationState;
    detectedLanguage: DetectedLanguage;
    userRole?: UserPersona;
  }): Promise<MultiAgentPlan> {
    const { message, conversationState, detectedLanguage, userRole } = params;

    // Use LLM provider for planning if available
    const provider = getLLMProvider();
    const basePlan = await provider.planIntent({
      message,
      conversationState,
      detectedLanguage,
    });

    const activeRole = userRole || basePlan.userPersona || detectUserRole(message, conversationState?.userRole);
    const vessel = basePlan.vesselContext || extractVesselContext(message);

    // Determine required specialized agents based on intent, persona, and tools
    const requiredAgents = new Set<string>();
    const requiredTools = basePlan.requiredTools;

    // Map tools & intents to specialized agents
    if (requiredTools.includes('getWeather')) {
      requiredAgents.add('Weather Intelligence Agent');
    }
    if (
      requiredTools.includes('getMarineConditions') ||
      requiredTools.includes('getChlorophyll') ||
      requiredTools.includes('getTide')
    ) {
      requiredAgents.add('Ocean Intelligence Agent');
    }
    if (
      requiredTools.includes('getLocationContext') ||
      requiredTools.includes('findNearestPort') ||
      requiredTools.includes('getGeofences')
    ) {
      requiredAgents.add('Geospatial Intelligence Agent');
    }
    if (requiredTools.includes('getMarineAlerts')) {
      requiredAgents.add('Alert & Disaster Agent');
    }
    if (
      requiredTools.includes('getPFZ') ||
      requiredTools.includes('analyzeMarineProductivity')
    ) {
      requiredAgents.add('Fishing & Productivity Agent');
    }
    if (requiredTools.includes('analyzeHistoricalMarineConditions')) {
      requiredAgents.add('Historical Analysis Agent');
    }
    if (requiredTools.includes('assessMarineRisk')) {
      requiredAgents.add('Marine Risk & Safety Agent');
      // Risk requires Weather, Ocean, Geospatial
      requiredAgents.add('Weather Intelligence Agent');
      requiredAgents.add('Ocean Intelligence Agent');
      requiredAgents.add('Geospatial Intelligence Agent');
    }
    if (requiredTools.includes('findSafestRoute')) {
      requiredAgents.add('Route Optimization Agent');
      requiredAgents.add('Geospatial Intelligence Agent');
      requiredAgents.add('Weather Intelligence Agent');
      requiredAgents.add('Ocean Intelligence Agent');
      requiredAgents.add('Marine Risk & Safety Agent');
    }

    if (basePlan.intent === 'PORT_QUERY') {
      requiredAgents.add('Geospatial Intelligence Agent');
    }

    // Role-specific agent additions
    if (activeRole === 'FISHERMAN') {
      if (basePlan.intent === 'MARINE_SAFETY_ASSESSMENT' || basePlan.intent === 'PFZ_QUERY') {
        requiredAgents.add('Fishing & Productivity Agent');
        requiredAgents.add('Alert & Disaster Agent');
      }
    } else if (activeRole === 'COASTAL_AUTHORITY' || activeRole === 'DISASTER_MANAGEMENT') {
      requiredAgents.add('Alert & Disaster Agent');
      requiredAgents.add('Geospatial Intelligence Agent');
    }

    // Fallback: If no specialized agent selected (e.g. general query), include Geospatial & Weather
    if (requiredAgents.size === 0) {
      requiredAgents.add('Geospatial Intelligence Agent');
      requiredAgents.add('Weather Intelligence Agent');
    }

    // Build Execution Phases & Tasks
    const phase1Agents: string[] = []; // Independent parallel agents
    const phase2Agents: string[] = []; // Risk (depends on weather + ocean + geospatial)
    const phase3Agents: string[] = []; // Route (depends on risk + geofences)

    for (const agentName of requiredAgents) {
      if (agentName === 'Marine Risk & Safety Agent') {
        phase2Agents.push(agentName);
      } else if (agentName === 'Route Optimization Agent') {
        phase3Agents.push(agentName);
      } else {
        phase1Agents.push(agentName);
      }
    }

    const executionPhases = [
      {
        phase: 1,
        description: 'Parallel execution of independent specialized intelligence agents',
        agentNames: phase1Agents,
      },
    ];

    if (phase2Agents.length > 0) {
      executionPhases.push({
        phase: 2,
        description: 'Deterministic Marine Safety & Risk Assessment',
        agentNames: phase2Agents,
      });
    }

    if (phase3Agents.length > 0) {
      executionPhases.push({
        phase: 3,
        description: 'A* Safe Passage Corridor & Hazard Avoidance Optimization',
        agentNames: phase3Agents,
      });
    }

    // Build structured tasks
    const tasks: AgentTask[] = [];
    let taskId = 1;

    for (const agentName of phase1Agents) {
      tasks.push({
        id: `task-${taskId++}`,
        agentName,
        priority: 1,
        parameters: { location: basePlan.location, time: basePlan.time },
      });
    }

    for (const agentName of phase2Agents) {
      tasks.push({
        id: `task-${taskId++}`,
        agentName,
        priority: 2,
        parameters: { location: basePlan.location, time: basePlan.time, vessel },
        dependencies: phase1Agents.filter((a) =>
          ['Weather Intelligence Agent', 'Ocean Intelligence Agent', 'Geospatial Intelligence Agent'].includes(a)
        ),
      });
    }

    for (const agentName of phase3Agents) {
      tasks.push({
        id: `task-${taskId++}`,
        agentName,
        priority: 3,
        parameters: { location: basePlan.location, origin: basePlan.location.name },
        dependencies: phase2Agents.length > 0 ? phase2Agents : phase1Agents,
      });
    }

    return {
      plan: {
        ...basePlan,
        userPersona: activeRole,
        vesselContext: vessel,
      },
      tasks,
      requiredSpecializedAgents: Array.from(requiredAgents),
      executionPhases,
    };
  }

  async execute(context: AgentContext, task?: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const multiPlan = await this.plan({
      message: context.userMessage,
      conversationState: context.conversationState,
      detectedLanguage: context.detectedLanguage,
      userRole: context.userRole,
    });

    return {
      agentName: this.name,
      success: true,
      summary: `Decomposed request into ${multiPlan.tasks.length} specialized tasks across ${multiPlan.requiredSpecializedAgents.length} agents.`,
      structuredData: {
        multiPlan,
      },
      evidence: [],
      warnings: [],
      provenance: [],
      confidence: 'HIGH',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export const plannerAgent = new PlannerAgent();
