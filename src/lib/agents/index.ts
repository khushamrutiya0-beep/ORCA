/**
 * ORCA Multi-Agent System
 * Exports all agent interfaces, specialized agents, orchestrators, and tool registries.
 */

// Agent interfaces & contracts
export type { 
  IAgent, 
  ISpecializedAgent,
  AgentContext,
  AgentTask,
  AgentResult,
  MapAction,
  ProvenanceRecord,
  IPlannerAgent, 
  IWeatherAgent, 
  IOceanAgent, 
  IGeospatialAgent, 
  IRiskAgent 
} from './interfaces';

// Specialized Agent Implementations
export { PlannerAgent, plannerAgent } from './plannerAgent';
export { WeatherAgent, weatherAgent } from './weatherAgent';
export { OceanAgent, oceanAgent } from './oceanAgent';
export { GeospatialAgent, geospatialAgent } from './geospatialAgent';
export { RiskAgent, riskAgent } from './riskAgent';
export { AlertAgent, alertAgent } from './alertAgent';
export { FishingAgent, fishingAgent } from './fishingAgent';
export { HistoricalAgent, historicalAgent } from './historicalAgent';
export { RouteAgent, routeAgent } from './routeAgent';
export { EvidenceAgent, evidenceAgent } from './evidenceAgent';
export { SynthesisAgent, synthesisAgent } from './synthesisAgent';
export { AgentOrchestrator, agentOrchestrator } from './orchestrator';

// Utilities
export { detectLanguage } from './languageDetector';
export { 
  createInitialConversationState, 
  updateConversationState, 
  sanitizeConversationState,
  extractVesselContext,
  detectUserRole,
  generateFollowUpSuggestions
} from './conversationContext';

// Tool registry
export { executeTool, ALLOWLISTED_TOOLS } from './tools/registry';
export { COASTAL_CITY_LOOKUP, lookupCityByAlias } from './tools/locationTool';
