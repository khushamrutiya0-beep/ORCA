/**
 * ORCA Specialized Multi-Agent Framework - Common Agent Contracts
 * Defines shared interfaces, contexts, task definitions, and results across all specialized agents.
 */

import { 
  AgentRole, 
  ConversationState, 
  DetectedLanguage, 
  EvidenceItem, 
  ResolvedLocation, 
  ResolvedTime, 
  UserPersona,
  DataStatus
} from '../types';

export interface MapAction {
  type: 'FLY_TO' | 'SHOW_GEOFENCE' | 'SHOW_ROUTE' | 'SHOW_PFZ' | 'SHOW_ALERT' | 'CENTER_MAP';
  latitude?: number;
  longitude?: number;
  zoom?: number;
  payload?: Record<string, unknown>;
}

export interface ProvenanceRecord {
  source: string;
  provider: string;
  status: DataStatus;
  timestamp: string;
  metric?: string;
  sourceType?: string;
}

export interface AgentContext {
  userMessage: string;
  userRole: UserPersona;
  detectedLanguage: DetectedLanguage;
  conversationState?: ConversationState;
  location: ResolvedLocation;
  timeRange: ResolvedTime;
  vesselProfile?: {
    vesselType?: string;
    lengthMeters?: number;
  };
  previousAgentResults?: Record<string, AgentResult>;
}

export interface AgentTask {
  id: string;
  agentName: string;
  priority: number;
  parameters: Record<string, unknown>;
  dependencies?: string[];
}

export interface AgentResult {
  agentName: string;
  success: boolean;
  summary: string;
  structuredData?: Record<string, unknown>;
  evidence: EvidenceItem[];
  warnings: string[];
  provenance: ProvenanceRecord[];
  mapActions?: MapAction[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  executionTimeMs?: number;
  error?: string;
}

export interface ISpecializedAgent {
  readonly role: AgentRole;
  readonly name: string;
  readonly description: string;
  execute(context: AgentContext, task?: AgentTask): Promise<AgentResult>;
}

// Backward compatibility interfaces
export interface IAgent {
  readonly role: AgentRole;
  readonly name: string;
  readonly description: string;
}

export interface IPlannerAgent extends IAgent {
  decomposeQuery(query: string, location?: { latitude: number; longitude: number }): Promise<unknown>;
}

export interface IWeatherAgent extends IAgent {
  analyzeWeather(lat: number, lon: number, timeWindow?: string): Promise<unknown>;
}

export interface IOceanAgent extends IAgent {
  analyzeOcean(lat: number, lon: number, timeWindow?: string): Promise<unknown>;
}

export interface IGeospatialAgent extends IAgent {
  analyzeSpatialContext(lat: number, lon: number): Promise<unknown>;
}

export interface IRiskAgent extends IAgent {
  evaluateRisk(weatherData: unknown, oceanData: unknown, spatialData: unknown): Promise<unknown>;
}
