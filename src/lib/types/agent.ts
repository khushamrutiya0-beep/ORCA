import { EvidenceItem } from './marine';
import { RiskAssessment } from './risk';

// ---------------------------------------------------------------------------
// Agent Roles & Language Detection
// ---------------------------------------------------------------------------

export type AgentRole = 'PLANNER' | 'WEATHER' | 'OCEAN' | 'GEOSPATIAL' | 'RISK' | 'EVIDENCE' | 'SYNTHESIZER';

export type DetectedLanguage = 'en' | 'hi' | 'gu' | 'unknown';

// ---------------------------------------------------------------------------
// User Intents — all categories from Milestone 4 spec
// ---------------------------------------------------------------------------

export type UserIntent =
  | 'MARINE_SAFETY_ASSESSMENT'
  | 'MARINE_CONDITIONS'
  | 'WEATHER_QUERY'
  | 'OCEAN_QUERY'
  | 'LOCATION_QUERY'
  | 'RISK_QUERY'
  | 'PORT_QUERY'
  | 'ROUTE_QUERY'
  | 'PFZ_QUERY'
  | 'TIDE_QUERY'
  | 'LIGHTNING_QUERY'
  | 'CYCLONE_QUERY'
  | 'PRODUCTIVITY_QUERY'
  | 'CHLOROPHYLL_QUERY'
  | 'GEOFENCE_QUERY'
  | 'HISTORICAL_MARINE_QUERY'
  | 'MULTI_FACTOR_MARINE_ANALYSIS'
  | 'ALERT_QUERY'
  | 'MARITIME_ALERT_QUERY'   // Milestone 5 — triggers alert tools
  | 'DATA_SOURCE_QUERY'      // Milestone 5 — triggers source status tool
  | 'GENERAL_MARINE_QUERY'
  | 'CAPABILITY_NOT_AVAILABLE'
  // Legacy aliases
  | 'VENTURE_SAFETY_CHECK'
  | 'WEATHER_FORECAST'
  | 'OCEAN_STATE'
  | 'PFZ_SEARCH'
  | 'HAZARD_INSPECTION'
  | 'PORT_PROXIMITY';

// ---------------------------------------------------------------------------
// Agent Execution Steps (UI display only — no chain-of-thought)
// ---------------------------------------------------------------------------

export interface AgentStep {
  agentRole: AgentRole;
  stepName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  outputSummary?: string;
  error?: string;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Tool System
// ---------------------------------------------------------------------------

export type ToolName =
  | 'getWeather'
  | 'getMarineConditions'
  | 'assessMarineRisk'
  | 'findNearestPort'
  | 'getLocationContext'
  | 'getMarineAlerts'
  | 'getPFZ'
  | 'getDataSourceStatus'
  | 'getTide'
  | 'getChlorophyll'
  | 'getGeofences'
  | 'analyzeMarineProductivity'
  | 'analyzeHistoricalMarineConditions'
  | 'findSafestRoute';

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: ToolParameter[];
  execute: (input: any) => Promise<ToolResult>;
}

export interface ToolCall {
  tool: ToolName;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool: ToolName;
  success: boolean;
  data?: unknown;
  evidence?: EvidenceItem[];
  error?: string;
  retrievedAt: string;
  sourceAttribution: string;
}

// ---------------------------------------------------------------------------
// Agent Plan (Planner output)
// ---------------------------------------------------------------------------

export type UserPersona = 
  | 'FISHERMAN' 
  | 'RESEARCHER' 
  | 'DISASTER_MANAGEMENT' 
  | 'COASTAL_AUTHORITY' 
  | 'MARITIME_OPERATOR' 
  | 'GENERAL_PUBLIC';

export type ResponsePersonality = 
  | 'QUICK_ANSWER' 
  | 'DETAILED_ANALYSIS' 
  | 'FISHERMAN_PRACTICAL' 
  | 'RESEARCH_SCIENTIFIC' 
  | 'COASTAL_OPERATIONAL' 
  | 'MARITIME_NAVIGATION' 
  | 'EDUCATIONAL_KNOWLEDGE';

export interface ResolvedLocation {
  name: string;
  latitude: number;
  longitude: number;
  resolvedFrom: 'EXPLICIT_COORDS' | 'CITY_LOOKUP' | 'CONTEXT_CARRY' | 'DEFAULT';
}

export interface ResolvedTime {
  label: string;
  isoString?: string;
  windowKey: 'current' | 'tomorrow_morning' | string;
}

export interface AgentPlan {
  intent: UserIntent;
  location: ResolvedLocation;
  time: ResolvedTime;
  requiredTools: ToolName[];
  steps: AgentStep[];
  detectedLanguage: DetectedLanguage;
  userPersona?: UserPersona;
  responsePersonality?: ResponsePersonality;
  vesselContext?: {
    vesselType?: string;
    lengthMeters?: number;
  };
  comparisonContext?: {
    isComparison: boolean;
    comparisonType?: 'TIME' | 'LOCATION' | 'NONE';
    secondLocation?: string;
    secondTime?: string;
  };
}

// ---------------------------------------------------------------------------
// Agent Response (full /api/agent response shape)
// ---------------------------------------------------------------------------

export interface MapContext {
  updateMap: boolean;
  coordinates?: { latitude: number; longitude: number };
  locationName?: string;
  riskLevel?: string;
  centerMap?: boolean;
}

export interface AgentResponse {
  answer: string;
  intent: UserIntent;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  plan: AgentPlan;
  toolResults: ToolResult[];
  evidence: EvidenceItem[];
  riskAssessment?: RiskAssessment;
  mapContext: MapContext;
  conversationState: ConversationState;
  detectedLanguage: DetectedLanguage;
  processingTimeMs: number;
  suggestedQuestions?: string[];
  agentExecution?: Array<{
    agent: string;
    status: 'completed' | 'failed' | 'skipped';
    durationMs?: number;
  }>;
}

// ---------------------------------------------------------------------------
// Conversation State (stateless — serialized round-trip client <-> server)
// ---------------------------------------------------------------------------

export interface ConversationState {
  currentLocation?: ResolvedLocation;
  currentTime?: ResolvedTime;
  previousIntent?: UserIntent;
  previousToolResults?: ToolResult[];
  messageCount: number;
  sessionStartedAt: string;
  userRole?: UserPersona;
  vesselType?: string;
  vesselLengthMeters?: number;
  preferredLanguage?: DetectedLanguage;
  recentTopics?: string[];
  lastObservedConditions?: {
    waveHeight?: number;
    windSpeed?: number;
    seaSurfaceTemperature?: number;
    riskScore?: number;
    riskLevel?: string;
  };
  departurePort?: string;
  destinationPort?: string;
  suggestedFollowUps?: string[];
}

// ---------------------------------------------------------------------------
// Chat Message (for UI)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'ORCA_AGENT' | 'SYSTEM';
  content: string;
  timestamp: string;
  intent?: UserIntent;
  targetLocation?: { latitude: number; longitude: number; name?: string };
  targetTimeWindow?: string;
  stepsExecuted?: AgentStep[];
  riskAssessment?: RiskAssessment;
  evidence?: EvidenceItem[];
  suggestedActions?: string[];
  detectedLanguage?: DetectedLanguage;
  isLoading?: boolean;
}
