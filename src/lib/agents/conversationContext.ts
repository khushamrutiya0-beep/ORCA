/**
 * ORCA Conversation Context & Memory Engine
 * Stateless round-trip: serialized to JSON by server, sent back by client on next message.
 * Enables multi-turn context carry, role tracking, vessel memory, condition caching, and follow-ups.
 */

import { 
  ConversationState, 
  ResolvedLocation, 
  ResolvedTime, 
  UserIntent, 
  ToolResult, 
  AgentPlan, 
  UserPersona,
  DetectedLanguage
} from '../types';

export function createInitialConversationState(): ConversationState {
  return {
    messageCount: 0,
    sessionStartedAt: new Date().toISOString(),
    recentTopics: [],
    suggestedFollowUps: [
      'Is it safe to go fishing tomorrow morning from Kochi?',
      'What are the wave heights near Porbandar?',
      'Are there any cyclone alerts near Chennai?',
      'Show marine productivity fronts near Goa',
    ],
  };
}

/**
 * Extract vessel information from user message if mentioned.
 */
export function extractVesselContext(message: string): { vesselType?: string; lengthMeters?: number } {
  const lower = message.toLowerCase();
  
  // Extract length in meters or feet
  const meterMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*(?:m|meter|meters|metre|metres)\b/);
  const feetMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*(?:ft|foot|feet)\b/);

  let lengthMeters: number | undefined = undefined;
  if (meterMatch) {
    lengthMeters = parseFloat(meterMatch[1]);
  } else if (feetMatch) {
    lengthMeters = parseFloat((parseFloat(feetMatch[1]) * 0.3048).toFixed(1));
  }

  let vesselType: string | undefined = undefined;
  if (lower.includes('small boat') || lower.includes('canoe') || lower.includes('dinghy') || lower.includes('frp boat') || (lengthMeters && lengthMeters < 8)) {
    vesselType = lengthMeters ? `Small Craft (${lengthMeters}m)` : 'Small Craft (<8m)';
  } else if (lower.includes('motorized') || lower.includes('motor boat') || (lengthMeters && lengthMeters >= 8 && lengthMeters <= 15)) {
    vesselType = lengthMeters ? `Motorized Fishing Craft (${lengthMeters}m)` : 'Motorized Fishing Craft (8–15m)';
  } else if (lower.includes('trawler') || lower.includes('mechanized') || lower.includes('deep sea') || (lengthMeters && lengthMeters > 15)) {
    vesselType = lengthMeters ? `Mechanized Deep-Sea Vessel (${lengthMeters}m)` : 'Mechanized Vessel (>15m)';
  } else if (lower.includes('ferry') || lower.includes('cargo') || lower.includes('tug')) {
    vesselType = 'Commercial Vessel';
  }

  return { vesselType, lengthMeters };
}

/**
 * Detect user role from message phrasing if explicit.
 */
export function detectUserRole(message: string, existingRole?: UserPersona): UserPersona {
  const lower = message.toLowerCase();
  if (lower.includes('fisherman') || lower.includes('fishing') || lower.includes('fish catch') || lower.includes('boat') || lower.includes('मछुआरे') || lower.includes('માછીમાર')) {
    return 'FISHERMAN';
  }
  if (lower.includes('research') || lower.includes('scientist') || lower.includes('climatology') || lower.includes('phytoplankton') || lower.includes('sst anomaly') || lower.includes('oceanographer')) {
    return 'RESEARCHER';
  }
  if (lower.includes('disaster') || lower.includes('cyclone warning') || lower.includes('evacuation') || lower.includes('ndrf') || lower.includes('sdrf') || lower.includes('relief')) {
    return 'DISASTER_MANAGEMENT';
  }
  if (lower.includes('coast guard') || lower.includes('port authority') || lower.includes('harbour master') || lower.includes('sanctuary ranger') || lower.includes('marine police')) {
    return 'COASTAL_AUTHORITY';
  }
  if (lower.includes('captain') || lower.includes('cargo') || lower.includes('passage') || lower.includes('shipping lane') || lower.includes('waypoint') || lower.includes('transit')) {
    return 'MARITIME_OPERATOR';
  }
  return existingRole ?? 'GENERAL_PUBLIC';
}

/**
 * Generate context-aware follow-up question suggestions based on intent and location.
 */
export function generateFollowUpSuggestions(
  intent: UserIntent, 
  locationName: string, 
  role: UserPersona,
  riskLevel?: string
): string[] {
  const loc = locationName.split(' ')[0] || 'nearby';

  switch (intent) {
    case 'MARINE_SAFETY_ASSESSMENT':
    case 'VENTURE_SAFETY_CHECK':
    case 'RISK_QUERY':
      if (riskLevel === 'HIGH' || riskLevel === 'SEVERE') {
        return [
          `When will conditions calm down near ${loc}?`,
          `Show nearest shelter port from ${loc}`,
          `Are there active cyclone alerts near ${loc}?`,
          `Can you suggest a safer route avoiding high waves?`,
        ];
      }
      return [
        `What is the best departure window for tomorrow?`,
        `How are the wave heights near ${loc}?`,
        `Where are today's potential fishing zones near ${loc}?`,
        `Show nearest safe harbour coordinates`,
      ];

    case 'OCEAN_QUERY':
    case 'OCEAN_STATE':
      return [
        `Is it safe for a small motorized boat tomorrow?`,
        `What are the wind speeds and gusts near ${loc}?`,
        `How does this compare to historical seasonal averages?`,
        `Are there dangerous swell waves expected?`,
      ];

    case 'WEATHER_QUERY':
    case 'WEATHER_FORECAST':
      return [
        `What are the wave and sea conditions near ${loc}?`,
        `Is it safe to go out to sea tomorrow morning?`,
        `Are any squall or storm warnings active?`,
      ];

    case 'MARITIME_ALERT_QUERY':
    case 'ALERT_QUERY':
      return [
        `What is the current wind speed near ${loc}?`,
        `Show emergency shelter ports near ${loc}`,
        `Find a safe navigation route avoiding the hazard`,
      ];

    case 'PFZ_QUERY':
    case 'PRODUCTIVITY_QUERY':
    case 'CHLOROPHYLL_QUERY':
      return [
        `What is the sea temperature and wave state near ${loc}?`,
        `Why are thermal fronts important for fishing?`,
        `How do current SST conditions compare historically?`,
      ];

    case 'ROUTE_QUERY':
      return [
        `Are there marine sanctuaries or restricted zones along this route?`,
        `Check wave conditions at destination`,
        `Show emergency ports along the transit corridor`,
      ];

    case 'HISTORICAL_MARINE_QUERY':
      return [
        `What is the live SST near ${loc} today?`,
        `How do chlorophyll levels affect seasonal fish catch?`,
        `Analyze current ocean productivity index`,
      ];

    default:
      return [
        `Check marine safety near ${loc}`,
        `View wave and wind telemetry`,
        `Are there active maritime warnings?`,
      ];
  }
}

export function updateConversationState(
  existing: ConversationState,
  plan: AgentPlan,
  toolResults: ToolResult[]
): ConversationState {
  // Extract cached condition snapshot
  const oceanTool = toolResults.find(r => r.tool === 'getMarineConditions' && r.success);
  const weatherTool = toolResults.find(r => r.tool === 'getWeather' && r.success);
  const riskTool = toolResults.find(r => r.tool === 'assessMarineRisk' && r.success);

  const oceanData = oceanTool?.data as any;
  const weatherData = weatherTool?.data as any;
  const riskData = riskTool?.data as any;

  const lastObservedConditions = {
    waveHeight: oceanData?.waveHeight?.value ?? existing.lastObservedConditions?.waveHeight,
    windSpeed: weatherData?.windSpeed?.value ?? existing.lastObservedConditions?.windSpeed,
    seaSurfaceTemperature: oceanData?.seaSurfaceTemperature?.value ?? existing.lastObservedConditions?.seaSurfaceTemperature,
    riskScore: riskData?.riskScore ?? existing.lastObservedConditions?.riskScore,
    riskLevel: riskData?.riskLevel ?? existing.lastObservedConditions?.riskLevel,
  };

  // Track recent topic history
  const recentTopics = Array.isArray(existing.recentTopics) ? [...existing.recentTopics] : [];
  if (plan.intent && !recentTopics.includes(plan.intent)) {
    recentTopics.push(plan.intent);
    if (recentTopics.length > 5) recentTopics.shift();
  }

  const userRole = plan.userPersona || existing.userRole || 'GENERAL_PUBLIC';
  const vesselType = plan.vesselContext?.vesselType || existing.vesselType;
  const vesselLengthMeters = plan.vesselContext?.lengthMeters || existing.vesselLengthMeters;

  const suggestedFollowUps = generateFollowUpSuggestions(
    plan.intent,
    plan.location.name,
    userRole,
    riskData?.riskLevel
  );

  return {
    currentLocation: plan.location,
    currentTime: plan.time,
    previousIntent: plan.intent,
    previousToolResults: toolResults.filter((r) => r.success).slice(0, 3),
    messageCount: (existing.messageCount ?? 0) + 1,
    sessionStartedAt: existing.sessionStartedAt ?? new Date().toISOString(),
    userRole,
    vesselType,
    vesselLengthMeters,
    preferredLanguage: plan.detectedLanguage,
    recentTopics,
    lastObservedConditions,
    suggestedFollowUps,
  };
}

/**
 * Validate and sanitize conversation state from client (untrusted input).
 */
export function sanitizeConversationState(raw: unknown): ConversationState {
  if (!raw || typeof raw !== 'object') return createInitialConversationState();
  const state = raw as Partial<ConversationState>;
  return {
    currentLocation: isValidLocation(state.currentLocation) ? state.currentLocation : undefined,
    currentTime: isValidTime(state.currentTime) ? state.currentTime : undefined,
    previousIntent: typeof state.previousIntent === 'string' ? state.previousIntent as UserIntent : undefined,
    previousToolResults: Array.isArray(state.previousToolResults) ? state.previousToolResults.slice(0, 3) : undefined,
    messageCount: typeof state.messageCount === 'number' ? Math.min(state.messageCount, 10000) : 0,
    sessionStartedAt: typeof state.sessionStartedAt === 'string' ? state.sessionStartedAt : new Date().toISOString(),
    userRole: typeof state.userRole === 'string' ? state.userRole as UserPersona : undefined,
    vesselType: typeof state.vesselType === 'string' ? state.vesselType.slice(0, 100) : undefined,
    vesselLengthMeters: typeof state.vesselLengthMeters === 'number' ? state.vesselLengthMeters : undefined,
    preferredLanguage: typeof state.preferredLanguage === 'string' ? state.preferredLanguage as DetectedLanguage : undefined,
    recentTopics: Array.isArray(state.recentTopics) ? state.recentTopics.slice(0, 5) : [],
    lastObservedConditions: state.lastObservedConditions,
    departurePort: typeof state.departurePort === 'string' ? state.departurePort.slice(0, 100) : undefined,
    destinationPort: typeof state.destinationPort === 'string' ? state.destinationPort.slice(0, 100) : undefined,
    suggestedFollowUps: Array.isArray(state.suggestedFollowUps) ? state.suggestedFollowUps.slice(0, 4) : undefined,
  };
}

function isValidLocation(loc: unknown): loc is ResolvedLocation {
  if (!loc || typeof loc !== 'object') return false;
  const l = loc as Partial<ResolvedLocation>;
  return typeof l.latitude === 'number' && typeof l.longitude === 'number' && typeof l.name === 'string';
}

function isValidTime(time: unknown): time is ResolvedTime {
  if (!time || typeof time !== 'object') return false;
  const t = time as Partial<ResolvedTime>;
  return typeof t.label === 'string' && typeof t.windowKey === 'string';
}
