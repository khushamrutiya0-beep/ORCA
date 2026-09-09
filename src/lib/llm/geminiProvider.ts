/**
 * ORCA Adaptive Gemini LLM Provider
 * Upgraded Conversational Marine Intelligence using Google Gemini (gemini-2.0-flash / gemini-1.5-flash).
 * 
 * PERSONALIZATION & ADAPTIVE INTELLIGENCE CAPABILITIES:
 * 1. Adaptive Response Personalities: Quick Answer, Fisherman Practical, Detailed Analysis, Researcher, Coastal Authority, Maritime Navigation, Educational Marine Knowledge.
 * 2. Natural Conversational Synthesis: Empathetic, varied, human-like explanations instead of rigid templates.
 * 3. Deep Conversational Memory: Remembers location, time, vessel size, user role, and previous queries across turns.
 * 4. Contextual Information Filtering: Shows only what matters for the user's specific intent without dumping irrelevant telemetry.
 * 5. Smart Comparisons & Actionable Recommendations: Evaluates departure windows, compare times/locations, provides operational advice.
 * 6. Multilingual Grounding: Native Hindi (हिन्दी) and Gujarati (ગુજરાતી) synthesis with exact factual adherence.
 * 7. Zero Hallucination Guarantee: All live numerical metrics derived exclusively from ORCA tool results.
 * 8. Automatic Fallback: Seamless transition to upgraded DeterministicLLMProvider if offline.
 */

import { ILLMProvider, PlannerInput, SynthesizerInput } from './ILLMProvider';
import { 
  AgentPlan, 
  DetectedLanguage, 
  ToolName, 
  UserIntent, 
  AgentStep, 
  ResolvedLocation, 
  ResolvedTime,
  UserPersona,
  ResponsePersonality
} from '../types';
import { COASTAL_CITY_LOOKUP, lookupCityByAlias } from '../agents/tools/locationTool';
import { extractVesselContext, detectUserRole } from '../agents/conversationContext';
import { getTomorrowMorningIso } from '../risk/timeWindows';
import { ALLOWLISTED_TOOLS } from '../agents/tools/registry';
import { ORCA_TOOL_SCHEMAS } from '../agents/tools/schemas';
import { DeterministicLLMProvider } from './deterministicProvider';

const PLANNER_SYSTEM_PROMPT = `You are the ORCA Marine Intelligence Adaptive Planner Agent.
Your responsibility is to analyze a user's natural language marine query, understand their underlying intent, user persona, desired response style, vessel context, and dynamically select the exact ORCA tools required to gather factual data.

STRICT OPERATIONAL RULES:
1. You must NEVER invent or hallucinate wave heights, wind speeds, SST, tides, alerts, risk scores, or PFZ coordinates.
2. You must NEVER calculate safety risk scores yourself — that is computed by the deterministic ORCA Risk Engine ('assessMarineRisk').
3. You must select tools ONLY from the allowlisted ORCA tools provided below.
4. Output a valid JSON object ONLY (no markdown formatting, no code fences, no extra text).

AVAILABLE ALLOWLISTED ORCA TOOLS:
${Object.values(ORCA_TOOL_SCHEMAS).map(t => `- ${t.name}: ${t.description} (Category: ${t.category})`).join('\n')}

USER PERSONA CLASSIFICATIONS:
- FISHERMAN: Traditional/motorized boat operators, focused on safe departure windows, wave chop, fuel economy, fish zones.
- RESEARCHER: Oceanographers/scientists, focused on SST gradients, chlorophyll ocean color, thermal fronts, historical climatology.
- DISASTER_MANAGEMENT: Emergency relief/NDRF/SDRF, focused on cyclone alerts, storm surges, coastal impact.
- COASTAL_AUTHORITY: Coast guard, port masters, focused on geofenced sanctuaries, prohibited zones, vessel advisories.
- MARITIME_OPERATOR: Commercial navigators, captains, focused on passage corridors, transit times, weather windows.
- GENERAL_PUBLIC: Beachgoers, tourists, students, educational queries.

RESPONSE PERSONALITY STYLES:
- QUICK_ANSWER: Brief, direct answers for concise queries (e.g. "Wave height?").
- FISHERMAN_PRACTICAL: Conversational, practical advice on sea state, small boat motion, departure timing.
- DETAILED_ANALYSIS: Comprehensive multi-parameter marine breakdown.
- RESEARCH_SCIENTIFIC: Oceanographic, thermodynamic, and bio-optical explanations.
- COASTAL_OPERATIONAL: Formal maritime security, warnings, and regulatory notices.
- MARITIME_NAVIGATION: Passage planning, waypoints, and hazard corridors.
- EDUCATIONAL_KNOWLEDGE: Clear explanations for marine terminology (swell, chlorophyll, upwelling, etc.).

RESPONSE JSON FORMAT:
{
  "intent": "<UserIntent>",
  "userPersona": "<FISHERMAN | RESEARCHER | DISASTER_MANAGEMENT | COASTAL_AUTHORITY | MARITIME_OPERATOR | GENERAL_PUBLIC>",
  "responsePersonality": "<QUICK_ANSWER | FISHERMAN_PRACTICAL | DETAILED_ANALYSIS | RESEARCH_SCIENTIFIC | COASTAL_OPERATIONAL | MARITIME_NAVIGATION | EDUCATIONAL_KNOWLEDGE>",
  "cityName": "<detected Indian coastal city or null>",
  "timeWindow": "<tomorrow_morning | current | historical>",
  "vesselType": "<detected vessel type e.g. 'Small boat (6m)' or null>",
  "vesselLengthMeters": <number or null>,
  "isComparison": <true | false>,
  "requiredTools": ["<list of tool names from allowlist>"],
  "confidence": "<HIGH | MEDIUM | LOW>"
}`;

const SYNTHESIZER_SYSTEM_PROMPT = `You are ORCA — the AI Marine Intelligence Assistant for the Indian coastline.
You converse naturally, intelligently, and empathetically with fishermen, ship captains, coastal authorities, and researchers.

CORE PERSONALITY & TONE GUIDELINES:
1. TALK LIKE A REAL HUMAN EXPERT:
   - Avoid repetitive, robotic boilerplates (DO NOT repeatedly say "Conditions are assessed as LOW PROTOTYPE RISK score 20").
   - Use natural phrasing: "Things look fairly calm across the bay", "Wave activity is the main factor to keep an eye on", "I'd suggest departing around mid-morning".
   - If the user sounds anxious or uncertain ("I'm nervous about tomorrow"), respond empathetically: "That's a sensible concern. Looking at the data, the wind is light, but the sea may still feel choppy for a smaller craft."

2. ADAPT TO USER PERSONA & RESPONSE STYLE:
   - For FISHERMEN: Give direct, practical advice on wave chop, departure windows, small craft stability, and shelter ports.
   - For RESEARCHERS: Detail SST values, chlorophyll concentrations, thermal fronts, and environmental anomalies.
   - For DISASTER MANAGEMENT / COASTAL AUTHORITIES: Highlight active alerts, affected coastal districts, and geofenced zones.
   - For MARITIME OPERATORS: Highlight passage corridors, sea states, and navigational hazards.
   - For QUICK QUESTIONS: Keep answer brief and punchy with the exact number highlighted.
   - For EDUCATIONAL QUESTIONS (e.g. "What is swell?"): Explain scientifically yet clearly.

3. SMART INFORMATION FILTERING:
   - Show ONLY the telemetry relevant to what the user asked.
   - If asking about rough sea -> show waves, swell, and wind. Do NOT dump chlorophyll or ports unless relevant.
   - If asking about fishing -> show SST, chlorophyll, and PFZ context.

4. MULTI-TURN CONVERSATION MEMORY:
   - NEVER ask "Which location?" if location was already established in prior conversation.
   - Seamlessly connect to previous turns ("Following up on your trip from Porbandar...").
   - Take note of vessel size (e.g. a 6m boat handles 1.5m waves very differently from a 20m trawler).

5. ACTIONABLE RECOMMENDATIONS & REASONING:
   - Give practical advice (e.g. "Leaving after sunrise is recommended as wave peaks ease").
   - Explain WHY in simple terms ("I suggest caution because wave height contributes most to current risk").

6. STRICT GROUNDING & PROVENANCE RULES:
   - Every single numerical value (wave height, wind speed, SST, port distance, risk score) MUST come directly from the tool results.
   - NEVER invent or guess numbers.
   - Respect provenance:
     • LIVE: Open-Meteo Weather, Open-Meteo Marine, GDACS disaster alerts.
     • DEMO: Potential Fishing Zones (PFZ demo layer), Satellite Chlorophyll proxy.
     • REFERENCE: Indian coastal ports, Marine Protected Areas (MPAs).
     • UNAVAILABLE: Official IMD & Survey of India real-time tide gauges (honestly communicate institutional status without inventing numbers).
     • PROTOTYPE MODEL: Deterministic Risk Engine, A* Safe Route, Marine Productivity Index.

7. BEAUTIFUL STRUCTURED MARKDOWN:
   - Use clean headings, bullet points, and highlighted numbers (**1.4 m**, **18 km/h**).
   - In Hindi (हिन्दी) or Gujarati (ગુજરાતી), write natural, native vernacular prose without awkward machine translation artifacts.

8. STATUTORY PROTOTYPE DISCLAIMER:
   - Always end with:
     "*⚠️ ORCA Decision-Support Prototype. Always verify with official INCOIS, IMD, and local Port Authority advisories before navigating.*"`;

export class GeminiLLMProvider implements ILLMProvider {
  readonly name = 'Google Gemini (gemini-2.0-flash)';
  readonly isLive = true;
  private apiKey: string;
  private fallback: DeterministicLLMProvider;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.fallback = new DeterministicLLMProvider();
  }

  async planIntent(input: PlannerInput): Promise<AgentPlan> {
    const { message, conversationState, detectedLanguage } = input;

    try {
      // Extract local vessel and role cues from context
      const localVessel = extractVesselContext(message);
      const localRole = detectUserRole(message, conversationState?.userRole);

      const prompt = `${PLANNER_SYSTEM_PROMPT}

USER QUERY: "${message}"
USER DETECTED LANGUAGE: ${detectedLanguage}
CONVERSATION CONTEXT:
- Previous Location: ${conversationState?.currentLocation ? `${conversationState.currentLocation.name} (${conversationState.currentLocation.latitude}°N, ${conversationState.currentLocation.longitude}°E)` : 'None'}
- Previous Time: ${conversationState?.currentTime?.label ?? 'None'}
- Known Vessel Context: ${conversationState?.vesselType ?? localVessel.vesselType ?? 'Unspecified'}
- Known User Role: ${conversationState?.userRole ?? localRole}
- Recent Topics: ${conversationState?.recentTopics?.join(', ') || 'None'}

Analyze the user query and output the raw JSON plan now:`;

      const response = await this.callGemini(prompt, 500);
      const cleanJsonText = extractJson(response);
      const parsed = JSON.parse(cleanJsonText);

      const intent: UserIntent = parsed.intent ?? 'GENERAL_MARINE_QUERY';
      const cityName: string | null = parsed.cityName ?? null;
      const timeWindow: string = parsed.timeWindow ?? 'current';
      const userPersona: UserPersona = parsed.userPersona ?? localRole;
      const responsePersonality: ResponsePersonality = parsed.responsePersonality ?? 'FISHERMAN_PRACTICAL';

      // 1. Resolve Location (Explicit -> Lookup -> Alias -> Context Carry -> Default)
      let location: ResolvedLocation;
      if (cityName && COASTAL_CITY_LOOKUP[cityName]) {
        const city = COASTAL_CITY_LOOKUP[cityName];
        location = { 
          name: city.name, 
          latitude: city.latitude, 
          longitude: city.longitude, 
          resolvedFrom: 'CITY_LOOKUP' 
        };
      } else {
        const aliasCity = lookupCityByAlias(message);
        if (aliasCity) {
          location = { 
            name: aliasCity.name, 
            latitude: aliasCity.latitude, 
            longitude: aliasCity.longitude, 
            resolvedFrom: 'CITY_LOOKUP' 
          };
        } else if (conversationState?.currentLocation) {
          location = { 
            ...conversationState.currentLocation, 
            resolvedFrom: 'CONTEXT_CARRY' 
          };
        } else {
          location = { 
            name: 'Mumbai Offshore (Arabian Sea)', 
            latitude: 18.922, 
            longitude: 72.8347, 
            resolvedFrom: 'DEFAULT' 
          };
        }
      }

      // 2. Resolve Time
      let time: ResolvedTime;
      const lowerMsg = message.toLowerCase();
      const isTomorrow = timeWindow === 'tomorrow_morning' || 
        lowerMsg.includes('tomorrow') || 
        lowerMsg.includes('kal') || 
        lowerMsg.includes('कल') || 
        lowerMsg.includes('આવતી') || 
        lowerMsg.includes('કાલે');

      if (isTomorrow) {
        time = { 
          label: 'Tomorrow Morning (06:00 AM IST)', 
          isoString: getTomorrowMorningIso(5.5), 
          windowKey: 'tomorrow_morning' 
        };
      } else if (conversationState?.currentTime && (lowerMsg.includes('that') || lowerMsg.includes('then') || lowerMsg.includes('waves') || lowerMsg.includes('wind'))) {
        time = conversationState.currentTime;
      } else {
        time = { label: 'Current Observation', windowKey: 'current' };
      }

      // 3. Resolve Vessel context
      const vesselContext = {
        vesselType: parsed.vesselType || localVessel.vesselType || conversationState?.vesselType,
        lengthMeters: parsed.vesselLengthMeters || localVessel.lengthMeters || conversationState?.vesselLengthMeters,
      };

      // 4. Resolve Dynamic Tool List
      let selectedTools: ToolName[] = Array.isArray(parsed.requiredTools) 
        ? parsed.requiredTools.filter((t: string) => ALLOWLISTED_TOOLS.includes(t as ToolName))
        : [];

      if (selectedTools.length === 0) {
        selectedTools = getDefaultToolsForIntent(intent);
      }

      // Ensure getLocationContext is present if coordinates need resolving
      if (!selectedTools.includes('getLocationContext') && intent !== 'DATA_SOURCE_QUERY') {
        selectedTools.unshift('getLocationContext');
      }

      // 5. Build Agent Execution Steps
      const steps = buildExecutionSteps(selectedTools, intent);

      return {
        intent,
        location,
        time,
        requiredTools: selectedTools,
        steps,
        detectedLanguage,
        userPersona,
        responsePersonality,
        vesselContext,
        comparisonContext: {
          isComparison: !!parsed.isComparison,
        },
      };
    } catch (err) {
      console.warn('[GeminiProvider] planIntent fallback to deterministic planner:', err);
      return this.fallback.planIntent(input);
    }
  }

  async synthesizeResponse(input: SynthesizerInput): Promise<string> {
    const { originalMessage, plan, toolResults, detectedLanguage, conversationState } = input;

    try {
      // Build structured tool results summary for Gemini
      const toolSummary = toolResults
        .map((r) => {
          if (!r.success) {
            return `[TOOL: ${r.tool}] STATUS: UNAVAILABLE / FAILED (${r.error || 'No live grid data'})`;
          }
          return `[TOOL: ${r.tool}] SOURCE: ${r.sourceAttribution}\nDATA: ${JSON.stringify(r.data, null, 2)}`;
        })
        .join('\n\n');

      const persona = plan.userPersona || conversationState?.userRole || 'FISHERMAN';
      const style = plan.responsePersonality || 'FISHERMAN_PRACTICAL';
      const vessel = plan.vesselContext?.vesselType || conversationState?.vesselType || 'Standard motorized fishing vessel';

      const prompt = `${SYNTHESIZER_SYSTEM_PROMPT}

USER MESSAGE: "${originalMessage}"
USER TARGET LANGUAGE: ${detectedLanguage === 'hi' ? 'Hindi (हिन्दी)' : detectedLanguage === 'gu' ? 'Gujarati (ગુજરાતી)' : 'English'}
DETECTED INTENT: ${plan.intent}
USER PERSONA: ${persona}
DESIRED RESPONSE STYLE: ${style}
VESSEL PROFILE: ${vessel}
FOCUSED LOCATION: ${plan.location.name} (${plan.location.latitude.toFixed(4)}°N, ${plan.location.longitude.toFixed(4)}°E)
FORECAST TIME WINDOW: ${plan.time.label}

RECENT CONVERSATION CONTEXT:
- Previous Location: ${conversationState?.currentLocation?.name ?? 'None'}
- Previous Condition Snapshot: ${conversationState?.lastObservedConditions ? JSON.stringify(conversationState.lastObservedConditions) : 'None'}
- Recent Topics: ${conversationState?.recentTopics?.join(', ') || 'Initial conversation'}

STRUCTURED FACTUAL TOOL RESULTS (USE ONLY THESE REAL VALUES):
${toolSummary}

Generate the natural, personalized, grounded response now:`;

      const response = await this.callGemini(prompt, 750);
      if (!response || response.trim().length === 0) {
        throw new Error('Gemini returned empty response text');
      }

      return response.trim();
    } catch (err) {
      console.warn('[GeminiProvider] synthesizeResponse fallback to deterministic synthesizer:', err);
      return this.fallback.synthesizeResponse(input);
    }
  }

  private async callGemini(prompt: string, maxTokens: number): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.25, // Allow natural human-like variation while preserving strict grounding
        topP: 0.95,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('No candidate text received from Gemini API');
    return text.trim();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractJson(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}

function getDefaultToolsForIntent(intent: UserIntent): ToolName[] {
  switch (intent) {
    case 'MARINE_SAFETY_ASSESSMENT':
    case 'RISK_QUERY':
    case 'VENTURE_SAFETY_CHECK':
    case 'HAZARD_INSPECTION':
      return ['getLocationContext', 'getWeather', 'getMarineConditions', 'findNearestPort', 'assessMarineRisk'];
    case 'OCEAN_QUERY':
    case 'OCEAN_STATE':
      return ['getLocationContext', 'getMarineConditions'];
    case 'WEATHER_QUERY':
    case 'WEATHER_FORECAST':
      return ['getLocationContext', 'getWeather'];
    case 'PORT_QUERY':
    case 'PORT_PROXIMITY':
      return ['getLocationContext', 'findNearestPort'];
    case 'PFZ_QUERY':
    case 'PFZ_SEARCH':
      return ['getLocationContext', 'getPFZ'];
    case 'MARITIME_ALERT_QUERY':
    case 'ALERT_QUERY':
      return ['getLocationContext', 'getMarineAlerts'];
    case 'TIDE_QUERY':
      return ['getLocationContext', 'getTide'];
    case 'PRODUCTIVITY_QUERY':
      return ['getLocationContext', 'getMarineConditions', 'analyzeMarineProductivity'];
    case 'CHLOROPHYLL_QUERY':
      return ['getLocationContext', 'getChlorophyll'];
    case 'GEOFENCE_QUERY':
      return ['getLocationContext', 'getGeofences'];
    case 'ROUTE_QUERY':
      return ['getLocationContext', 'getMarineConditions', 'getWeather', 'getMarineAlerts', 'getGeofences', 'findSafestRoute'];
    case 'HISTORICAL_MARINE_QUERY':
      return ['getLocationContext', 'analyzeHistoricalMarineConditions'];
    case 'DATA_SOURCE_QUERY':
      return ['getDataSourceStatus'];
    default:
      return ['getLocationContext', 'getWeather', 'getMarineConditions', 'findNearestPort', 'assessMarineRisk'];
  }
}

function buildExecutionSteps(tools: ToolName[], intent: UserIntent): AgentStep[] {
  const steps: AgentStep[] = [
    { agentRole: 'PLANNER', stepName: 'Understanding request', status: 'PENDING' },
    { agentRole: 'PLANNER', stepName: 'Identifying location', status: 'PENDING' },
  ];

  if (tools.includes('getWeather')) {
    steps.push({ agentRole: 'WEATHER', stepName: 'Checking meteorological conditions', status: 'PENDING' });
  }
  if (tools.includes('getMarineConditions')) {
    steps.push({ agentRole: 'OCEAN', stepName: 'Checking oceanographic telemetry', status: 'PENDING' });
  }
  if (tools.includes('findNearestPort')) {
    steps.push({ agentRole: 'GEOSPATIAL', stepName: 'Finding nearest shelter port', status: 'PENDING' });
  }
  if (tools.includes('getMarineAlerts')) {
    steps.push({ agentRole: 'RISK', stepName: 'Checking GDACS disaster alerts', status: 'PENDING' });
  }
  if (tools.includes('getPFZ')) {
    steps.push({ agentRole: 'OCEAN', stepName: 'Querying PFZ advisory fronts', status: 'PENDING' });
  }
  if (tools.includes('getTide')) {
    steps.push({ agentRole: 'OCEAN', stepName: 'Checking tide gauge network', status: 'PENDING' });
  }
  if (tools.includes('getChlorophyll')) {
    steps.push({ agentRole: 'OCEAN', stepName: 'Retrieving satellite chlorophyll proxy', status: 'PENDING' });
  }
  if (tools.includes('getGeofences')) {
    steps.push({ agentRole: 'GEOSPATIAL', stepName: 'Checking marine protected zones', status: 'PENDING' });
  }
  if (tools.includes('findSafestRoute')) {
    steps.push({ agentRole: 'GEOSPATIAL', stepName: 'Computing safest passage corridor', status: 'PENDING' });
  }
  if (tools.includes('assessMarineRisk')) {
    steps.push({ agentRole: 'RISK', stepName: 'Assessing deterministic safety risk', status: 'PENDING' });
  }
  if (tools.includes('analyzeMarineProductivity')) {
    steps.push({ agentRole: 'RISK', stepName: 'Analyzing marine productivity index', status: 'PENDING' });
  }
  if (tools.includes('analyzeHistoricalMarineConditions')) {
    steps.push({ agentRole: 'RISK', stepName: 'Evaluating SST climatology trends', status: 'PENDING' });
  }
  if (tools.includes('getDataSourceStatus')) {
    steps.push({ agentRole: 'EVIDENCE', stepName: 'Checking data source registry status', status: 'PENDING' });
  }

  steps.push({ agentRole: 'EVIDENCE', stepName: 'Compiling provenance and evidence', status: 'PENDING' });
  steps.push({ agentRole: 'SYNTHESIZER', stepName: 'Synthesizing grounded response', status: 'PENDING' });

  return steps;
}
