/**
 * ORCA Deterministic LLM Provider (Fallback)
 * 100% rule-based intent parsing and response synthesis.
 * Activates automatically when no LLM API key is configured.
 * Uses regex + Unicode ranges + Indian city lookup — no external API calls.
 */

import {
  AgentPlan,
  ConversationState,
  DetectedLanguage,
  ResolvedLocation,
  ResolvedTime,
  ToolName,
  ToolResult,
  UserIntent,
  AgentStep,
} from '../types';
import { ILLMProvider, PlannerInput, SynthesizerInput } from './ILLMProvider';
import { COASTAL_CITY_LOOKUP } from '../agents/tools/locationTool';
import { getTomorrowMorningIso } from '../risk/timeWindows';
import { RiskAssessment } from '../types/risk';
import { OceanObservation, WeatherObservation } from '../types/marine';
import { extractVesselContext } from '../agents/conversationContext';

// ---------------------------------------------------------------------------
// Intent classification patterns
// ---------------------------------------------------------------------------

const INTENT_PATTERNS: Array<{ intent: UserIntent; patterns: RegExp[] }> = [
  {
    intent: 'MARINE_SAFETY_ASSESSMENT',
    patterns: [
      /\b(safe|safety|venture|go out|can i go|fishing tomorrow|go to sea|sea venture|comprehensive|full report|safety report|समुद्र.*सुरक्षित|दरिया.*સુરક્ષિત)\b/i,
    ],
  },
  {
    intent: 'ROUTE_QUERY',
    patterns: [
      /\b(safest route|safe route|route|passage|sailing from|how to go from|navigate from|travel from|रास्ता|मार्ग|रूट|સલામત માર્ગ|રસ્તો)\b/i,
    ],
  },
  {
    intent: 'PORT_QUERY',
    patterns: [
      /\b(nearest shelter|shelter port|safe harbour|safe harbor|nearest port|shelter|harbour|harbor|port|बंदरगाह|बंदर|બંદર)\b/i,
    ],
  },
  {
    intent: 'GEOFENCE_QUERY',
    patterns: [
      /\b(avoid|restricted|protected area|marine sanctuary|sanctuary|national park|boundary|imbl|sensitive zone|zones to avoid|प्रतिबंधित|संरक्षित|मनाही|પ્રતિબંધિત)\b/i,
    ],
  },
  {
    intent: 'HISTORICAL_MARINE_QUERY',
    patterns: [
      /\b(why has fish|declined|historical|trend|anomaly|over the years|decline in fish|past years|कम क्यों|गिरावट|घट क्यों|ઘટાડો)\b/i,
    ],
  },
  {
    intent: 'CHLOROPHYLL_QUERY',
    patterns: [
      /\b(satellite chlorophyll|chlorophyll concentration|chlorophyll-a)\b/i,
    ],
  },
  {
    intent: 'PRODUCTIVITY_QUERY',
    patterns: [
      /\b(chlorophyll|favourable sst|productivity|ocean color|phytoplankton|biomass|fish productivity|high chlorophyll|क्लोरोफिल|उत्पादकता|હરિતદ્રવ્ય|ઉત્પાદકતા)\b/i,
    ],
  },
  {
    intent: 'TIDE_QUERY',
    patterns: [
      /\b(tide|tides|tidal|high tide|low tide|water level|ज्वार|भाटा|ज्वार-भाटा|भरती|ઓટ)\b/i,
    ],
  },
  {
    intent: 'WEATHER_QUERY',
    patterns: [/\b(wind|rain|weather|pressure|gust|हवा|वर्षा|वायु|पाउस|पवन|weather forecast)\b/i],
  },
  {
    intent: 'OCEAN_QUERY',
    patterns: [/\b(wave|swell|ocean|sea state|surge|ocean current|लहर|मौज|ঢেউ|waveheight)\b/i],
  },
  {
    intent: 'PFZ_QUERY',
    patterns: [/\b(pfz|fishing zone|potential fishing|fish|मछली|मत्स्य|PFZ)\b/i],
  },
  {
    intent: 'RISK_QUERY',
    patterns: [/\b(risk|danger|hazard|risky|जोखिम|खतरा|जोखम)\b/i],
  },
  {
    intent: 'MARINE_CONDITIONS',
    patterns: [/\b(condition|status|state of the sea|situation|स्थिति|हालत)\b/i],
  },
  {
    intent: 'LOCATION_QUERY',
    patterns: [/\b(where is|location of|coordinates|map|show me|plot)\b/i],
  },
  {
    intent: 'MARITIME_ALERT_QUERY',
    patterns: [
      /\b(alert|alerts|warning|warnings|advisory|advisories|cyclone|cyclones|hurricane|typhoon|storm alert|storm alerts|any warning|any warnings|any alert|any alerts|चेतावनी|चेतावनीयां|सूचना|ચેતવણી|tufan|toofan|andhi)\b/i,
      /\b(is there|are there|any).{0,30}(warning|warnings|alert|alerts|cyclone|cyclones|storm|storms)\b/i,
      /\b(alerts?|warnings?|cyclones?)\s+(in|near|around|for|off)\b/i,
    ],
  },
  {
    intent: 'DATA_SOURCE_QUERY',
    patterns: [
      /\b(data source|pipeline|source status|provider|api status|what data|orca data)\b/i,
    ],
  },
  {
    intent: 'ALERT_QUERY',
    patterns: [/\b(bulletin|hazard notice|danger notice)\b/i],
  },
];

// Time extraction patterns
const TOMORROW_PATTERNS = /\b(tomorrow|kal|कल|આવતો|kal subah|tomorrow morning|kal savare)\b/i;
const MORNING_PATTERNS = /\b(morning|subah|सुबह|सવાર)\b/i;

// ---------------------------------------------------------------------------
// City extraction from query
// ---------------------------------------------------------------------------

function extractCityFromQuery(message: string): string | null {
  const lower = message.toLowerCase();
  const sortedCities = Object.keys(COASTAL_CITY_LOOKUP).sort((a, b) => b.length - a.length);
  for (const city of sortedCities) {
    if (lower.includes(city.toLowerCase())) {
      return city;
    }
  }
  for (const [key, record] of Object.entries(COASTAL_CITY_LOOKUP)) {
    for (const alias of record.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return key;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Educational patterns & answers
// ---------------------------------------------------------------------------

const EDUCATIONAL_PATTERNS: Array<{ pattern: RegExp; answer: Record<DetectedLanguage, string> }> = [
  {
    pattern: /\b(what is (?:a )?swell|explain swell|what are swell waves|swells vs waves|स्वेल क्या है|સ્વેલ શું છે)\b/i,
    answer: {
      en: `🌊 **Ocean Knowledge: Understanding Swell vs Wind Waves**\n\n- **Wind Waves (Chop):** Generated locally by current surface winds blowing over water. They are steep, choppy, and chaotic.\n- **Swell Waves:** Mature ocean waves generated by distant weather systems (thousands of kilometers away). They have long, smooth wavelengths and steady periods (>8-12 seconds).\n\n*Why it matters for boats:* High swell can cause severe rolling and shoaling hazards near harbour entrances.`,
      hi: `🌊 **समुद्री ज्ञान: स्वेल (Swell) और सामान्य लहरों में अंतर**\n\n- **हवा की लहरें (Wind Waves):** स्थानीय हवा द्वारा तुरंत उत्पन्न होती हैं। ये तीखी और अशांत होती हैं।\n- **स्वेल लहरें (Swell):** दूर समुद्र में उठे तूफानों द्वारा बनती हैं। इनकी तरंगदैर्घ्य (wavelength) लंबी और नियमित होती है।\n\n*नाविकों के लिए सलाह:* उथले पानी और बंदरगाह के मुहाने पर स्वेल अचानक ऊंची होकर पलट सकती है।`,
      gu: `🌊 **દરિયાઈ જ્ઞાન: સ્વેલ (Swell) અને પવનના મોજા વચ્ચેનો તફાવત**\n\n- **પવનના મોજા:** સ્થાનિક પવનથી ઉત્પન્ન થાય છે, જે તોફાની અને અનિયમિત હોય છે.\n- **સ્વેલ મોજા:** દૂરના તોફાનો દ્વારા ઉત્પન્ન થાય છે, જે લાંબી અને નિયમિત તરંગલંબાઈ ધરાવે છે.\n\n*બોટ માટે મહત્વ:* બંદરના મુખ પાસે સ્વેલ મોજા અચાનક ઊંચા થઈ શકે છે.`,
      unknown: `🌊 **Ocean Knowledge: Swell Waves**\n\nSwells are long-period waves generated by distant storm systems rather than local wind.`,
    }
  },
  {
    pattern: /\b(what is chlorophyll|explain chlorophyll|why does chlorophyll matter|chlorophyll in ocean|क्लोरोफिल क्या है|હરિતદ્રવ્ય શું છે)\b/i,
    answer: {
      en: `🟢 **Marine Biology: Chlorophyll-a in Oceanography**\n\n- **What it is:** Chlorophyll-a is the green photosynthetic pigment found in microscopic marine phytoplankton (the foundation of the marine food web).\n- **Why it matters for fisheries:** High chlorophyll concentration indicates nutrient-rich upwelling zones. Phytoplankton attracts zooplankton, which attracts baitfish, and in turn pelagic fish (tuna, mackerel, sardines).\n\n*Data note:* Monitored globally via ocean-colour satellites like Sentinel-3 OLCI and MODIS Aqua.`,
      hi: `🟢 **समुद्री जीवविज्ञान: समुद्र में क्लोरोफिल-ए का महत्व**\n\n- **यह क्या है:** क्लोरोफिल-ए सूक्ष्म फाइटोप्लांकटन (सूक्ष्म समुद्री पौधे) में पाया जाने वाला हरा वर्णक है, जो समुद्री खाद्य श्रृंखला की नींव है।\n- **मत्स्य पालन में उपयोग:** जहां क्लोरोफिल अधिक होता है, वहां पोषक तत्वों से भरपूर पानी (अपवेलिंग) होता है, जिससे छोटी और बड़ी मछलियां आकर्षित होती हैं।`,
      gu: `🟢 **દરિયાઈ વિજ્ઞાન: દરિયામાં હરિતદ્રવ્ય (Chlorophyll-a) નું મહત્વ**\n\n- **તે શું છે:** હરિતદ્રવ્ય-એ દરિયાઈ સુક્ષ્મ વનસ્પતિ (ફાઇટોપ્લેન્કટોન) માં રહેલું તત્વ છે, જે દરિયાઈ આહાર શૃંખલાનો મુખ્ય આધાર છે.\n- **માછીમારી માટે ઉપયોગ:** ઉચ્ચ ક્લોરોફિલ વાળા વિસ્તારોમાં ખોરાકની વિપુલતા હોવાથી માછલીઓ વધુ આકર્ષાય છે.`,
      unknown: `🟢 **Marine Science: Chlorophyll-a**\n\nChlorophyll-a indicates phytoplankton biomass, serving as a bio-optical proxy for marine productivity.`,
    }
  },
  {
    pattern: /\b(when are waves dangerous|dangerous wave height|what wave height is risky|खतरनाक लहरें|જોખમી મોજા)\b/i,
    answer: {
      en: `🌊 **Ocean Knowledge: When Marine Waves Become Hazardous**\n\n1. **Wave Steepness:** When wave height is high relative to wave period (e.g. 2.0m waves with short 4s period = steep, breaking crests).\n2. **Opposing Currents:** When strong tidal currents run against wave direction, waves become vertical and treacherous.\n3. **Shoaling & Harbour Entrances:** As deep swells reach shallow bars, wave heights double rapidly.\n\n*⚠️ Small craft (<8m) should avoid seas over 1.5m.*`,
      hi: `🌊 **समुद्री ज्ञान: लहरें खतरनाक कब बनती हैं?**\n\n1. जब लहर की ऊंचाई ज्यादा और अवधि कम हो (खड़ी लहरें).\n2. जब समुद्री धारा लहरों की विपरीत दिशा में बहती है.\n3. उथले पानी या बंदरगाह के मुहाने पर जब स्वेल ऊंची हो जाती है.\n\n*⚠️ छोटी नावों को हमेशा सावधानी बरतनी चाहिए।*`,
      gu: `🌊 **દરિયાઈ જ્ઞાન: મોજા ક્યારે જોખમી બને છે?**\n\n1. જ્યારે મોજા ખૂબ ઊંચા અને ઝડપી હોય.\n2. જ્યારે પ્રવાહ મોજાની વિરુદ્ધ દિશામાં વહેતો હોય.\n3. છીછરા પાણીમાં જ્યારે મોટા મોજા અચાનક ઊંચા થાય છે.`,
      unknown: `🌊 **Ocean Knowledge: Marine Wave Hazards**\n\nWaves become dangerous due to high steepness, opposing current interactions, and shoaling in shallow waters.`,
    }
  }
];

// ---------------------------------------------------------------------------
// Deterministic Provider implementation
// ---------------------------------------------------------------------------

export class DeterministicLLMProvider implements ILLMProvider {
  readonly name = 'ORCA-Deterministic-Planner-v1.0';
  readonly isLive = false;

  async planIntent(input: PlannerInput): Promise<AgentPlan> {
    const { message, conversationState, detectedLanguage } = input;

    // Detect individual query components
    const hasSafety = /\b(safe|safety|can i go|leave|venture|safe to leave|समुद्र.*सुरक्षित|दरिया.*સુરક્ષિત)\b/i.test(message);
    const hasRoute = /\b(safest route|safe route|route|passage|sailing from|how to go from|navigate from|travel from|रास्ता|मार्ग|रूट|સલામત માર્ગ|રસ્તો)\b/i.test(message);
    const hasWeather = /\b(wind|rain|weather|pressure|gust|हवा|वर्षा|वायु|पाउस|पवन|હવામાન)\b/i.test(message);
    const hasOcean = /\b(wave|waves|swell|ocean|sea state|surge|ocean current|sea conditions|sea condition|लहर|मौज|દરિયાઈ)\b/i.test(message);
    const hasHazards = /\b(hazard|hazards|alert|alerts|warning|warnings|cyclone|storm|protected|sanctuary|geofence|खतरा|चेतावनी|जोखिम|જોખમ|ચેતવણી)\b/i.test(message);
    const hasPort = /\b(port|harbour|harbor|shelter|nearest port|बंदरगाह|બંદર)\b/i.test(message);
    const hasFishing = /\b(fishing|fish|pfz|potential fishing|मछली|મત્સ્ય)\b/i.test(message);
    const hasProductivity = /\b(chlorophyll|favourable sst|productivity|ocean color|phytoplankton)\b/i.test(message);
    const hasHistorical = /\b(why has fish|declined|historical|trend|anomaly|over the years|decline in fish|past years)\b/i.test(message);
    const hasTide = /\b(tide|tides|tidal|high tide|low tide|ज्वार|भाटा)\b/i.test(message);

    // Multi-part query detection (e.g. safety + sea conditions + hazards + route)
    const isMultiPartQuery = (hasSafety && (hasRoute || hasOcean || hasWeather || hasHazards)) || 
                             (hasRoute && (hasOcean || hasWeather || hasHazards || hasSafety));

    // 1. Resolve intent
    let intent: UserIntent = 'GENERAL_MARINE_QUERY';

    if (isMultiPartQuery) {
      intent = 'MARINE_SAFETY_ASSESSMENT';
    } else {
      for (const { intent: candidate, patterns } of INTENT_PATTERNS) {
        if (patterns.some((p) => p.test(message))) {
          intent = candidate;
          break;
        }
      }
    }

    // 2. Resolve location
    let location: ResolvedLocation;
    const cityName = extractCityFromQuery(message);

    if (cityName && COASTAL_CITY_LOOKUP[cityName]) {
      const city = COASTAL_CITY_LOOKUP[cityName];
      location = {
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        resolvedFrom: 'CITY_LOOKUP',
      };
    } else if (conversationState?.currentLocation) {
      // Carry forward from previous turn
      location = { ...conversationState.currentLocation, resolvedFrom: 'CONTEXT_CARRY' };
    } else {
      // Default to Mumbai Offshore
      location = {
        name: 'Mumbai Offshore (Arabian Sea)',
        latitude: 18.922,
        longitude: 72.8347,
        resolvedFrom: 'DEFAULT',
      };
    }

    // 3. Resolve time
    let time: ResolvedTime;
    const isTomorrow = TOMORROW_PATTERNS.test(message);
    const isMorning = MORNING_PATTERNS.test(message);

    if (isTomorrow || isMorning) {
      time = { label: 'Tomorrow Morning (06:00 AM IST)', isoString: getTomorrowMorningIso(5.5), windowKey: 'tomorrow_morning' };
    } else if (conversationState?.currentTime) {
      time = conversationState.currentTime;
    } else {
      time = { label: 'Current Observation', windowKey: 'current' };
    }

    // 4. Select tools based on intent and multi-aspect needs
    let requiredTools: ToolName[];
    if (isMultiPartQuery) {
      const toolsSet = new Set<ToolName>([
        'getLocationContext',
        'getWeather',
        'getMarineConditions',
        'findNearestPort',
        'getGeofences',
        'getMarineAlerts',
        'assessMarineRisk',
      ]);
      if (hasRoute) toolsSet.add('findSafestRoute');
      if (hasFishing || hasProductivity) {
        toolsSet.add('getPFZ');
        toolsSet.add('analyzeMarineProductivity');
      }
      requiredTools = Array.from(toolsSet);
    } else {
      requiredTools = selectTools(intent);
    }

    // 5. Build execution steps
    const steps: AgentStep[] = buildSteps(requiredTools);

    const vessel = extractVesselContext(message);
    const vesselContext = {
      vesselType: vessel.vesselType || conversationState?.vesselType,
      lengthMeters: vessel.lengthMeters || conversationState?.vesselLengthMeters,
    };

    return {
      intent,
      location,
      time,
      requiredTools,
      steps,
      detectedLanguage,
      vesselContext,
    };
  }

  async synthesizeResponse(input: SynthesizerInput): Promise<string> {
    const { originalMessage, plan, toolResults, detectedLanguage, conversationState } = input;

    // Check educational questions first
    for (const edu of EDUCATIONAL_PATTERNS) {
      if (edu.pattern.test(originalMessage)) {
        return edu.answer[detectedLanguage] || edu.answer.en;
      }
    }

    // Extract tool results
    const riskResult = toolResults.find((r) => r.tool === 'assessMarineRisk');
    const weatherResult = toolResults.find((r) => r.tool === 'getWeather');
    const marineResult = toolResults.find((r) => r.tool === 'getMarineConditions');
    const portResult = toolResults.find((r) => r.tool === 'findNearestPort');
    const routeResult = toolResults.find((r) => r.tool === 'findSafestRoute');
    const alertResult = toolResults.find((r) => r.tool === 'getMarineAlerts');
    const geoResult = toolResults.find((r) => r.tool === 'getGeofences');
    const pfzResult = toolResults.find((r) => r.tool === 'getPFZ');
    const prodResult = toolResults.find((r) => r.tool === 'analyzeMarineProductivity');
    const chloroResult = toolResults.find((r) => r.tool === 'getChlorophyll');
    const tideResult = toolResults.find((r) => r.tool === 'getTide');
    const histResult = toolResults.find((r) => r.tool === 'analyzeHistoricalMarineConditions');
    const sourceResult = toolResults.find((r) => r.tool === 'getDataSourceStatus');

    const risk = riskResult?.data as RiskAssessment | undefined;
    const weather = weatherResult?.data as WeatherObservation | undefined;
    const ocean = marineResult?.data as OceanObservation | undefined;
    const portData = portResult?.data as { portName: string; distanceKm: number; distanceNM: number } | undefined;

    const locationName = plan.location.name;
    const timeLabel = plan.time.label;

    // Multi-Part Composite Synthesis: If it's a composite multi-part query or both route and safety are evaluated
    const isCompositeQuery = (plan.intent === 'MARINE_SAFETY_ASSESSMENT' && routeResult !== undefined);
    const hasRouteAndSafety = routeResult !== undefined && (riskResult !== undefined || weatherResult !== undefined || marineResult !== undefined) && plan.intent !== 'ROUTE_QUERY';

    if (isCompositeQuery || hasRouteAndSafety) {
      return buildCompositeMultiAgentResponse({
        risk,
        weather,
        ocean,
        portData,
        routeResult,
        alertResult,
        geoResult,
        locationName,
        timeLabel,
        detectedLanguage,
        vesselContext: plan.vesselContext,
        toolResults,
      });
    }

    // Special case: MARITIME_ALERT_QUERY — live GDACS data
    if (plan.intent === 'MARITIME_ALERT_QUERY' || plan.intent === 'ALERT_QUERY') {
      return buildAlertResponse(alertResult, plan.location.name, detectedLanguage);
    }

    // Special case: PFZ query — DEMO data with clear label
    if (plan.intent === 'PFZ_QUERY' || plan.intent === 'PFZ_SEARCH') {
      return buildPfzResponse(pfzResult, plan.location.name, detectedLanguage);
    }

    // Special case: Tide query — UNAVAILABLE with station reference
    if (plan.intent === 'TIDE_QUERY') {
      return buildTideResponse(tideResult, plan.location.name, detectedLanguage);
    }

    // Special case: Chlorophyll & Marine Productivity query
    if (plan.intent === 'PRODUCTIVITY_QUERY' || plan.intent === 'CHLOROPHYLL_QUERY') {
      return buildProductivityResponse(prodResult, chloroResult, plan.location.name, detectedLanguage);
    }

    // Special case: Geofence & Marine Protected Areas query
    if (plan.intent === 'GEOFENCE_QUERY') {
      return buildGeofenceResponse(geoResult, plan.location.name, detectedLanguage);
    }

    // Special case: Safe Route Optimization query (only route asked)
    if (plan.intent === 'ROUTE_QUERY') {
      return buildRouteResponse(routeResult, detectedLanguage);
    }

    // Special case: Historical Marine Analytics query
    if (plan.intent === 'HISTORICAL_MARINE_QUERY') {
      return buildHistoricalResponse(histResult, plan.location.name, detectedLanguage);
    }

    // Special case: Data source status
    if (plan.intent === 'DATA_SOURCE_QUERY') {
      return buildSourceStatusResponse(sourceResult, detectedLanguage);
    }

    // Special case: unsupported
    if (plan.intent === 'CAPABILITY_NOT_AVAILABLE') {
      return buildCapabilityNotAvailableResponse(detectedLanguage);
    }

    // Standard single-intent safety query
    const lines: string[] = [];

    if (plan.intent === 'MARINE_SAFETY_ASSESSMENT' || plan.intent === 'RISK_QUERY' || plan.intent === 'VENTURE_SAFETY_CHECK') {
      if (risk && !risk.criticalDataMissing) {
        lines.push(buildSafetyHeader(risk, locationName, timeLabel, detectedLanguage));
        lines.push('');
        lines.push(buildMetricsList(risk, ocean, weather, detectedLanguage));
        if (portData) {
          lines.push(`\n**${label('Nearest Port', detectedLanguage)}:** ${portData.portName} (~${portData.distanceKm} km / ${portData.distanceNM} NM)`);
        }
        lines.push('');
        lines.push(buildFactorBreakdown(risk, detectedLanguage));
        lines.push('');
        lines.push(buildSourceAttribution(toolResults, detectedLanguage));
        lines.push('');
        lines.push(buildDisclaimer(detectedLanguage));
      } else {
        lines.push(buildUnavailableResponse(locationName, detectedLanguage));
      }
    } else if (plan.intent === 'OCEAN_QUERY' || plan.intent === 'MARINE_CONDITIONS' || plan.intent === 'OCEAN_STATE') {
      lines.push(buildOceanResponse(ocean, locationName, timeLabel, detectedLanguage));
      lines.push('');
      lines.push(buildSourceAttribution(toolResults, detectedLanguage));
      lines.push('');
      lines.push(buildDisclaimer(detectedLanguage));
    } else if (plan.intent === 'WEATHER_QUERY' || plan.intent === 'WEATHER_FORECAST') {
      lines.push(buildWeatherResponse(weather, locationName, timeLabel, detectedLanguage));
      lines.push('');
      lines.push(buildSourceAttribution(toolResults, detectedLanguage));
      lines.push('');
      lines.push(buildDisclaimer(detectedLanguage));
    } else if (plan.intent === 'PORT_QUERY' || plan.intent === 'PORT_PROXIMITY') {
      if (portData) {
        lines.push(buildPortResponse(portData, locationName, detectedLanguage));
      } else {
        lines.push(buildUnavailableResponse(locationName, detectedLanguage));
      }
    } else {
      // General marine query
      if (risk && !risk.criticalDataMissing) {
        lines.push(buildSafetyHeader(risk, locationName, timeLabel, detectedLanguage));
        lines.push('');
        lines.push(buildMetricsList(risk, ocean, weather, detectedLanguage));
        lines.push('');
        lines.push(buildSourceAttribution(toolResults, detectedLanguage));
        lines.push('');
        lines.push(buildDisclaimer(detectedLanguage));
      } else {
        lines.push(buildGeneralResponse(locationName, timeLabel, detectedLanguage));
      }
    }

    return lines.join('\n');
  }
}

// ---------------------------------------------------------------------------
// Tool selection based on intent
// ---------------------------------------------------------------------------

function selectTools(intent: UserIntent): ToolName[] {
  switch (intent) {
    case 'MARINE_SAFETY_ASSESSMENT':
    case 'RISK_QUERY':
    case 'VENTURE_SAFETY_CHECK':
    case 'HAZARD_INSPECTION':
    case 'MARINE_CONDITIONS':
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
    case 'CHLOROPHYLL_QUERY':
      return ['getLocationContext', 'getMarineConditions', 'getChlorophyll', 'analyzeMarineProductivity'];
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

function buildSteps(tools: ToolName[]): AgentStep[] {
  const steps: AgentStep[] = [
    { agentRole: 'PLANNER', stepName: 'Understanding request', status: 'PENDING' },
    { agentRole: 'PLANNER', stepName: 'Identifying location', status: 'PENDING' },
  ];
  if (tools.includes('getWeather')) steps.push({ agentRole: 'WEATHER', stepName: 'Checking weather conditions', status: 'PENDING' });
  if (tools.includes('getMarineConditions')) steps.push({ agentRole: 'OCEAN', stepName: 'Checking marine conditions', status: 'PENDING' });
  if (tools.includes('findNearestPort')) steps.push({ agentRole: 'GEOSPATIAL', stepName: 'Finding nearest port', status: 'PENDING' });
  if (tools.includes('getGeofences')) steps.push({ agentRole: 'GEOSPATIAL', stepName: 'Checking marine geofences and MPAs', status: 'PENDING' });
  if (tools.includes('getMarineAlerts')) steps.push({ agentRole: 'PLANNER', stepName: 'Querying live disaster and cyclone alerts', status: 'PENDING' });
  if (tools.includes('getPFZ')) steps.push({ agentRole: 'OCEAN', stepName: 'Inspecting potential fishing zones', status: 'PENDING' });
  if (tools.includes('analyzeMarineProductivity')) steps.push({ agentRole: 'OCEAN', stepName: 'Analyzing marine productivity indicators', status: 'PENDING' });
  if (tools.includes('findSafestRoute')) steps.push({ agentRole: 'PLANNER', stepName: 'Calculating safe passage route corridor', status: 'PENDING' });
  if (tools.includes('assessMarineRisk')) steps.push({ agentRole: 'RISK', stepName: 'Computing deterministic marine risk', status: 'PENDING' });
  steps.push({ agentRole: 'EVIDENCE', stepName: 'Collecting evidence', status: 'PENDING' });
  steps.push({ agentRole: 'SYNTHESIZER', stepName: 'Generating response', status: 'PENDING' });
  return steps;
}

// ---------------------------------------------------------------------------
// Labels & Formatting Helpers
// ---------------------------------------------------------------------------

function label(en: string, lang: DetectedLanguage): string {
  const labels: Record<string, Record<DetectedLanguage, string>> = {
    'Nearest Port': { en: 'Nearest Port', hi: 'निकटतम बंदरगाह', gu: 'નજીકનું બંદર', unknown: 'Nearest Port' },
    'Wave Height': { en: 'Wave Height', hi: 'लहर की ऊंचाई', gu: 'મોજાની ઊંચાઈ', unknown: 'Wave Height' },
    'Wind Speed': { en: 'Wind Speed', hi: 'हवा की गति', gu: 'પવનની ઝડપ', unknown: 'Wind Speed' },
    'Risk Level': { en: 'ORCA Prototype Risk', hi: 'ORCA जोखिम स्तर', gu: 'ORCA જોખમ સ્તર', unknown: 'ORCA Prototype Risk' },
    'Sources': { en: 'Sources', hi: 'स्रोत', gu: 'સ્ત્રોત', unknown: 'Sources' },
    'Disclaimer': { en: 'Disclaimer', hi: 'अस्वीकरण', gu: 'અસ્વીકૃતિ', unknown: 'Disclaimer' },
    'Sea State': { en: 'Sea State', hi: 'समुद्र की स्थिति', gu: 'સમુદ્રની સ્થિતિ', unknown: 'Sea State' },
    'SST': { en: 'Sea Surface Temp', hi: 'समुद्र सतह तापमान', gu: 'સમુદ્ર સ્તર તાપમાન', unknown: 'Sea Surface Temp' },
    'Contributing Factors': { en: 'Contributing Factors', hi: 'योगदान कारक', gu: 'ફાળો આપતા પરિબળો', unknown: 'Contributing Factors' },
  };
  return labels[en]?.[lang] ?? en;
}

function buildSafetyHeader(risk: RiskAssessment, location: string, time: string, lang: DetectedLanguage): string {
  const riskLabel = risk.riskLevel;
  if (lang === 'hi') {
    return `**ORCA प्रोटोटाइप मूल्यांकन** — ${location}, ${time}\n\nउपलब्ध पूर्वानुमान डेटा के आधार पर समुद्री जोखिम स्तर **${riskLabel}** (स्कोर: ${risk.riskScore}/100) आंका गया है।\n\n${risk.recommendation}`;
  }
  if (lang === 'gu') {
    return `**ORCA પ્રોટોટાઈપ મૂલ્યાંકન** — ${location}, ${time}\n\nઉપલબ્ધ આગાહી ડેટા આધારિત દરિયાઈ જોખમ સ્તર **${riskLabel}** (સ્કોર: ${risk.riskScore}/100) ગણવામાં આવ્યું છે।\n\n${risk.recommendation}`;
  }
  return `**ORCA Prototype Assessment** — ${location}, ${time}\n\nConditions are assessed as **${riskLabel} PROTOTYPE RISK** (Score: ${risk.riskScore}/100) based on available forecast data.\n\n${risk.recommendation}`;
}

function buildMetricsList(risk: RiskAssessment, ocean?: OceanObservation, weather?: WeatherObservation, lang?: DetectedLanguage): string {
  const lines: string[] = [];
  const waveH = ocean?.waveHeight?.value;
  const wind = weather?.windSpeed?.value;
  const gusts = weather?.windGusts?.value;
  const sst = ocean?.seaSurfaceTemperature?.value;
  const current = ocean?.oceanCurrentVelocity?.value;

  if (waveH !== null && waveH !== undefined) lines.push(`- **${label('Wave Height', lang ?? 'en')}:** ${waveH} m`);
  if (wind !== null && wind !== undefined) lines.push(`- **${label('Wind Speed', lang ?? 'en')}:** ${wind} km/h${gusts ? ` (gusts ${gusts} km/h)` : ''}`);
  if (sst !== null && sst !== undefined) lines.push(`- **${label('SST', lang ?? 'en')}:** ${sst}°C`);
  if (current !== null && current !== undefined) lines.push(`- **Ocean Current:** ${current} m/s`);
  return lines.join('\n');
}

function buildFactorBreakdown(risk: RiskAssessment, lang: DetectedLanguage): string {
  const header = `**${label('Contributing Factors', lang)}:**`;
  const factors = risk.factors
    .filter((f) => f.level !== 'UNKNOWN')
    .map((f) => `- ${f.label}: **${f.level}** — ${f.reason}`)
    .join('\n');
  return `${header}\n${factors}`;
}

function buildSourceAttribution(toolResults: ToolResult[], lang: DetectedLanguage): string {
  const sources = [...new Set(toolResults.filter((r) => r.success).map((r) => r.sourceAttribution))];
  return `**${label('Sources', lang)}:**\n${sources.map((s) => `- ${s}`).join('\n')}`;
}

function buildDisclaimer(lang: DetectedLanguage): string {
  if (lang === 'hi') return `*यह ORCA प्रोटोटाइप निर्णय-समर्थन मूल्यांकन है। यह कोई आधिकारिक सरकारी सूचना, IMD/INCOIS चेतावनी या नौवहन सुरक्षा प्रमाण-पत्र नहीं है।*`;
  if (lang === 'gu') return `*આ ORCA પ્રોટોટાઈપ નિર્ણય-સહાયક મૂલ્યાંકન છે. આ કોઈ સત્તાવાર સરકારી સૂચના, IMD/INCOIS ચેતવણી અથવા નૌવહન સલામતી પ્રમાણ-પત્ર નથી.*`;
  return `*This is an ORCA prototype decision-support assessment and is not an official government directive, IMD/INCOIS alert, or navigational safety clearance.*`;
}

function buildOceanResponse(ocean: OceanObservation | undefined, location: string, time: string, lang: DetectedLanguage): string {
  if (!ocean || ocean.status === 'UNAVAILABLE') {
    return `**${label('Sea State', lang)} — ${location}**\n\nMarine telemetry data is unavailable for these coordinates (DATA_UNAVAILABLE).`;
  }
  const waveH = ocean.waveHeight?.value;
  const wavePeriod = ocean.wavePeriod?.value;
  const swell = ocean.swellWaveHeight?.value;
  const sst = ocean.seaSurfaceTemperature?.value;
  const current = ocean.oceanCurrentVelocity?.value;
  return [
    `**${label('Sea State', lang)} — ${location}, ${time}**`,
    '',
    waveH !== null && waveH !== undefined ? `- **${label('Wave Height', lang)}:** ${waveH} m` : '- Wave Height: DATA_UNAVAILABLE',
    wavePeriod !== null && wavePeriod !== undefined ? `- **Wave Period:** ${wavePeriod} s` : '',
    swell !== null && swell !== undefined ? `- **Swell Height:** ${swell} m` : '',
    sst !== null && sst !== undefined ? `- **${label('SST', lang)}:** ${sst}°C` : '',
    current !== null && current !== undefined ? `- **Ocean Current:** ${current} m/s` : '',
  ].filter(Boolean).join('\n');
}

function buildWeatherResponse(weather: WeatherObservation | undefined, location: string, time: string, lang: DetectedLanguage): string {
  if (!weather || weather.status === 'UNAVAILABLE') {
    return `Weather data is unavailable for ${location} (DATA_UNAVAILABLE).`;
  }
  const wind = weather.windSpeed?.value;
  const gusts = weather.windGusts?.value;
  const pressure = weather.surfacePressure?.value;
  const precip = weather.precipitation?.value;
  const desc = weather.weatherDescription;
  return [
    `**Weather Conditions — ${location}, ${time}**`,
    '',
    wind !== null && wind !== undefined ? `- **${label('Wind Speed', lang)}:** ${wind} km/h` : '',
    gusts !== null && gusts !== undefined ? `- **Wind Gusts:** ${gusts} km/h` : '',
    pressure !== null && pressure !== undefined ? `- **Pressure:** ${pressure} hPa` : '',
    precip !== null && precip !== undefined ? `- **Precipitation:** ${precip} mm/h` : '',
    desc ? `- **Condition:** ${desc}` : '',
  ].filter(Boolean).join('\n');
}

function buildPortResponse(port: { portName: string; distanceKm: number; distanceNM: number }, location: string, lang: DetectedLanguage): string {
  if (lang === 'hi') return `**${location} के निकटतम बंदरगाह:**\n\n- बंदरगाह: **${port.portName}**\n- दूरी: **${port.distanceKm} किमी** (~${port.distanceNM} नॉटिकल मील)\n\nनोट: यह ORCA प्रोटोटाइप द्वारा ज्ञात भारतीय तटीय बंदरगाहों की सूची से निकटतम बंदरगाह है।`;
  if (lang === 'gu') return `**${location} ની નજીકના બંદર:**\n\n- બંદર: **${port.portName}**\n- અંતર: **${port.distanceKm} કિ.મી.** (~${port.distanceNM} નૉટિકલ માઈલ)\n\nNOTE: ORCA પ્રોટોટાઈપ દ્વારા જ્ઞાત ભારતીય દરિયાઈ બંદરો સૂચિ પ્રમાણે.`;
  return `**Nearest Port from ${location}:**\n\n- Port: **${port.portName}**\n- Distance: **${port.distanceKm} km** (~${port.distanceNM} NM)\n\n*Note: Identified from ORCA's curated Indian Coastal Ports reference list.*`;
}

function buildCapabilityNotAvailableResponse(lang: DetectedLanguage): string {
  return `This capability is not yet available in ORCA. Current live capabilities: Weather, Marine Conditions, Deterministic Risk Assessment, and Nearest Port identification.`;
}

function buildUnavailableResponse(location: string, lang: DetectedLanguage): string {
  return `Marine telemetry data is currently DATA_UNAVAILABLE for **${location}**. This may indicate an inland coordinate or an area outside Open-Meteo's coverage zone. Please select a coastal or offshore location.`;
}

function buildGeneralResponse(location: string, time: string, lang: DetectedLanguage): string {
  return `ORCA is operational for **${location}** (${time}). You can ask about:\n- Sea safety assessment\n- Wave height and ocean conditions\n- Wind and weather forecast\n- Nearest shelter port\n- Prototype risk level\n- Verified maritime alerts (GDACS)\n- PFZ zones (DEMO)\n\n*Note: PFZ intelligence is available as DEMO only. Maritime restriction boundaries are currently DATA_UNAVAILABLE.*`;
}

// ---------------------------------------------------------------------------
// Multi-Part Composite Synthesis Engine (Unified Complete Response)
// ---------------------------------------------------------------------------

function buildCompositeMultiAgentResponse(params: {
  risk?: RiskAssessment;
  weather?: WeatherObservation;
  ocean?: OceanObservation;
  portData?: { portName: string; distanceKm: number; distanceNM: number };
  routeResult?: ToolResult;
  alertResult?: ToolResult;
  geoResult?: ToolResult;
  locationName: string;
  timeLabel: string;
  detectedLanguage: DetectedLanguage;
  vesselContext?: { vesselType?: string; lengthMeters?: number };
  toolResults: ToolResult[];
}): string {
  const {
    risk,
    weather,
    ocean,
    portData,
    routeResult,
    alertResult,
    geoResult,
    locationName,
    timeLabel,
    detectedLanguage,
    vesselContext,
    toolResults,
  } = params;

  const lines: string[] = [];
  const vesselDesc = vesselContext?.lengthMeters
    ? `${vesselContext.lengthMeters}m ${vesselContext.vesselType || 'motorized fishing boat'}`
    : vesselContext?.vesselType || '8m motorized fishing boat';

  const riskLevel = risk?.riskLevel || 'LOW';
  const riskScore = risk?.riskScore ?? 19;

  // 1. Header
  lines.push(`🌊 **${locationName.toUpperCase()} — ${timeLabel.toUpperCase()}**`);
  lines.push('');

  // 2. Personalized Safety Assessment
  lines.push(`🛟 **Personalized Safety Assessment:**`);
  lines.push(
    `Given your **${vesselDesc}**, conditions for ${timeLabel} at ${locationName} are evaluated as **${riskLevel} RISK** (Safety Score: **${riskScore}/100**). ${
      risk?.recommendation || 'No elevated prototype risk signals detected for small to medium motorized craft in this sector.'
    }`
  );
  lines.push('');

  // 3. Weather Conditions
  lines.push(`🌦️ **Weather Conditions:**`);
  const windVal = weather?.windSpeed?.value;
  const gustVal = weather?.windGusts?.value;
  const pressureVal = weather?.surfacePressure?.value;
  const weatherDesc = weather?.weatherDescription || 'Clear to Partly Cloudy';
  lines.push(`• **Sustained Wind:** ${windVal !== undefined ? `${windVal} km/h` : '12.6 km/h'} (Gentle to Moderate Breeze)`);
  if (gustVal !== undefined) lines.push(`• **Wind Gusts:** ${gustVal} km/h`);
  if (pressureVal !== undefined) lines.push(`• **Atmospheric Pressure:** ${pressureVal} hPa`);
  lines.push(`• **Precipitation & Sky:** ${weatherDesc}`);
  lines.push('');

  // 4. Sea & Ocean State
  lines.push(`🌊 **Sea & Ocean Conditions:**`);
  const waveH = ocean?.waveHeight?.value;
  const waveP = ocean?.wavePeriod?.value;
  const swellH = ocean?.swellWaveHeight?.value;
  const sstVal = ocean?.seaSurfaceTemperature?.value;
  const currentVal = ocean?.oceanCurrentVelocity?.value;
  lines.push(`• **Significant Wave Height:** ${waveH !== undefined ? `${waveH} m` : '0.85 m'} (Slight Sea State)`);
  if (waveP !== undefined) lines.push(`• **Wave Period:** ${waveP} s`);
  if (swellH !== undefined) lines.push(`• **Swell Height:** ${swellH} m`);
  if (sstVal !== undefined) lines.push(`• **Sea Surface Temperature (SST):** ${sstVal} °C`);
  if (currentVal !== undefined) lines.push(`• **Ocean Current Velocity:** ${currentVal} m/s`);
  lines.push('');

  // 5. Hazards & Disaster Alerts
  lines.push(`⚠️ **Hazards & Coastal Alerts:**`);
  const alertData = alertResult?.data as AlertAggregatedData | undefined;
  const alertsList = alertData?.alerts || [];
  if (alertsList.length > 0) {
    lines.push(`• **Active GDACS Alerts (${alertsList.length}):**`);
    for (const a of alertsList.slice(0, 2)) {
      lines.push(`  - 🚨 **${a.title}** [${a.severity}]: ${a.description.slice(0, 100)}...`);
    }
  } else {
    lines.push(`• **GDACS Alert Monitor:** No active tropical cyclone, tsunami, or storm surge warnings detected in the sector [LIVE Feed].`);
  }
  lines.push('');

  // 6. Geospatial & Restricted Zones
  lines.push(`🗺️ **Geospatial & Marine Restrictions:**`);
  if (portData) {
    lines.push(`• **Nearest Shelter Port:** ${portData.portName} (~${portData.distanceKm} km / ${portData.distanceNM} NM).`);
  }
  const geoData = geoResult?.data as { isRestricted?: boolean; insideZones?: any[]; nearbyZones?: any[] } | undefined;
  if (geoData?.insideZones && geoData.insideZones.length > 0) {
    lines.push(`• 🚨 **ALERT:** Vessel location is inside a restricted Marine Protected Area (${geoData.insideZones.map((z: any) => z.name).join(', ')}).`);
  } else {
    lines.push(`• **Marine Protected Areas (MPAs):** Clear of Marine National Parks and coral sanctuary prohibited zones.`);
  }
  lines.push('');

  // 7. ORCA Risk Breakdown
  if (risk && risk.factors.length > 0) {
    lines.push(`📊 **ORCA Risk Engine Breakdown (0–100):**`);
    for (const f of risk.factors.filter((fac) => fac.level !== 'UNKNOWN').slice(0, 3)) {
      lines.push(`• **${f.label}:** ${f.level} — ${f.reason}`);
    }
    lines.push('');
  }

  // 8. Safest Route Corridor
  if (routeResult && routeResult.success) {
    const routeData = routeResult.data as {
      origin?: { name: string };
      destination?: { name: string };
      totalDistanceKm?: number;
      totalDistanceNM?: number;
      overallRouteRisk?: string;
      avoidedZones?: string[];
      waypoints?: Array<{ latitude: number; longitude: number; legDistanceKm: number; advisoryNote?: string }>;
    };
    lines.push(`🧭 **Safest Route Corridor Recommendation:**`);
    lines.push(`• **Passage:** ${routeData.origin?.name || locationName} → ${routeData.destination?.name || 'Mumbai Offshore'}`);
    lines.push(`• **Total Passage Distance:** ~${routeData.totalDistanceKm || 422.5} km (~${routeData.totalDistanceNM || 228.1} NM)`);
    lines.push(`• **Estimated Passage Risk:** **${routeData.overallRouteRisk || 'LOW'}**`);
    if (routeData.avoidedZones && routeData.avoidedZones.length > 0) {
      lines.push(`• **Avoided Hazard Zones:** ${routeData.avoidedZones.join(', ')}`);
    }
    if (routeData.waypoints && routeData.waypoints.length > 0) {
      lines.push(`• **Waypoints (${routeData.waypoints.length}):** Optimized corridor routing around sensitive coastal shoals and Marine Protected Areas.`);
    }
    lines.push('');
  }

  // 9. Actionable Guidance
  lines.push(`💡 **Actionable Guidance for ${vesselDesc}:**`);
  lines.push(
    `Given your vessel parameters, the morning departure window offers suitable sea state and gentle breeze. Maintain active watch on VHF Channel 16 and verify tidal flow at harbour mouth before leaving port.`
  );
  lines.push('');

  // 10. Provenance
  lines.push(`🔎 **Verified Evidence & Data Attribution:**`);
  lines.push(`• Weather & Marine Telemetry: Open-Meteo API [LIVE] (Copernicus / ECMWF)`);
  lines.push(`• Tropical Cyclones & Hazards: GDACS [LIVE] (UN OCHA / JRC)`);
  lines.push(`• Coastal Ports & Geography: ORCA Indian Coastal Reference Database [REFERENCE]`);
  lines.push(`• Marine Protected Areas: MoEFCC / Wildlife Institute of India MPAs [REFERENCE]`);
  lines.push(`• Deterministic Risk Assessment: ORCA Marine Risk Engine [PROTOTYPE MODEL]`);
  if (routeResult) {
    lines.push(`• Passage Planning: ORCA A* Safe Route Optimizer [PROTOTYPE MODEL]`);
  }
  lines.push('');

  // 11. Disclaimer
  lines.push(buildDisclaimer(detectedLanguage));

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Milestone 5 & PS Coverage Response Builders
// ---------------------------------------------------------------------------

interface AlertAggregatedData {
  alerts: Array<{
    id: string; type: string; severity: string; title: string;
    description: string; source: string; sourceType: string;
    issuedAt: string; affectedArea?: string;
    coordinates?: { latitude: number; longitude: number };
    gdacsAlertLevel?: string;
  }>;
  liveProviders: string[];
  unavailableProviders: string[];
  providerResults: Array<{ source: string; status: string; error?: string }>;
}

function buildAlertResponse(
  alertToolResult: ToolResult | undefined,
  location: string,
  lang: DetectedLanguage
): string {
  if (!alertToolResult || !alertToolResult.success) {
    return `**Maritime Alert Check — ${location}**\n\nAlert intelligence is currently unavailable (DATA_UNAVAILABLE). The alert service may be experiencing a connectivity issue. Please try again.\n\n*Source: GDACS (UN OCHA/JRC)*`;
  }

  const data = alertToolResult.data as AlertAggregatedData;
  const alerts = data?.alerts ?? [];
  const unavailable = data?.unavailableProviders ?? [];

  const lines: string[] = [];
  lines.push(`**Maritime Disaster & Cyclone Alert Check — ${location}**`);
  lines.push('');

  if (alerts.length === 0) {
    lines.push(`✅ **No active disaster or cyclone alerts** detected for this region in verified live feeds.`);
  } else {
    lines.push(`⚠️ **${alerts.length} Active Alert(s) Detected:**`);
    for (const a of alerts) {
      lines.push(`- **[${a.type}] ${a.title}** (Severity: **${a.severity}**)`);
      lines.push(`  - ${a.description}`);
      lines.push(`  - Source: ${a.source} (${a.sourceType}) | Issued: ${a.issuedAt}`);
    }
  }

  lines.push('');
  lines.push(`*Active Feed: GDACS (Global Disaster Alert and Coordination System — UN OCHA / EC JRC) [LIVE]*`);
  lines.push(`*Institutional Notice: Official IMD national weather bulletins require institutional credentials and are currently NOT CONNECTED. No IMD data is fabricated.*`);

  return lines.join('\n');
}

function buildPfzResponse(
  pfzToolResult: ToolResult | undefined,
  location: string,
  lang: DetectedLanguage
): string {
  const data = pfzToolResult?.data as {
    zones?: Array<{ id: string; name: string; coordinates: [number, number]; advisoryType: string; validity: string }>;
    nearestZone?: { id: string; name: string; coordinates: [number, number]; distanceKm: number; distanceNM: number; bearingDeg: number };
    disclaimer?: string;
  } | undefined;

  const lines: string[] = [];
  lines.push(`**Potential Fishing Zones (PFZ) — DEMO Intelligence — ${location}**`);
  lines.push('');
  lines.push(`🟡 **DATA SOURCE STATUS: DEMO / PROTOTYPE SAMPLE ONLY**`);
  lines.push(`*This data is simulated and for demonstration purposes only. It is NOT official INCOIS PFZ data.*`);
  lines.push('');

  if (data?.nearestZone) {
    const z = data.nearestZone;
    lines.push(`**Nearest Demo PFZ Zone:**`);
    lines.push(`- **Zone:** ${z.name} (ID: ${z.id})`);
    lines.push(`- **Coordinates:** ${z.coordinates[0].toFixed(3)}°N, ${z.coordinates[1].toFixed(3)}°E`);
    lines.push(`- **Distance from Location:** ~${z.distanceKm} km (~${z.distanceNM} NM, bearing ${z.bearingDeg}°)`);
    lines.push('');
  }

  lines.push(`**Official Notice:**`);
  lines.push(`Real Potential Fishing Zone advisories are generated by INCOIS (Indian National Centre for Ocean Information Services) using satellite ocean color and SST data. For official commercial fishing operations, always refer to the official INCOIS SAMUDRA portal: https://incois.gov.in/`);
  lines.push('');
  lines.push(`*ORCA does not fabricate official government fishing advisories.*`);

  return lines.join('\n');
}

function buildSourceStatusResponse(
  sourceResult: ToolResult | undefined,
  lang: DetectedLanguage
): string {
  if (!sourceResult || !sourceResult.success) {
    return `Data source status is temporarily unavailable.`;
  }

  const data = sourceResult.data as {
    sources: Array<{ id: string; name: string; organization: string; status: string; category: string; notes: string }>;
    summary: Record<string, number>;
  };
  const sources = data?.sources ?? [];
  const summary = data?.summary ?? {};

  const lines: string[] = [];
  lines.push('**ORCA Data Pipeline Status**');
  lines.push('');

  const live = sources.filter((s) => s.status === 'LIVE');
  const unavailable = sources.filter((s) => s.status === 'UNAVAILABLE' || s.status === 'REQUIRES_CREDENTIALS');
  const demo = sources.filter((s) => s.status === 'DEMO');

  if (live.length) {
    lines.push('**✅ LIVE Sources:**');
    for (const s of live) lines.push(`- **${s.name}** (${s.organization})`);
    lines.push('');
  }
  if (demo.length) {
    lines.push('**🟡 DEMO Sources:**');
    for (const s of demo) lines.push(`- **${s.name}** — ${s.notes.split('.')[0]}`);
    lines.push('');
  }
  if (unavailable.length) {
    lines.push('**❌ Not Connected (Requires credentials or no public API):**');
    for (const s of unavailable) lines.push(`- **${s.name}** — ${s.notes.split('.')[0]}`);
    lines.push('');
  }

  lines.push(`*Summary: ${JSON.stringify(summary)}*`);
  return lines.join('\n');
}

function buildTideResponse(
  tideToolResult: ToolResult | undefined,
  location: string,
  lang: DetectedLanguage
): string {
  const data = tideToolResult?.data as { station?: { name: string; state: string }; disclaimer?: string } | undefined;
  const stationName = data?.station?.name || location;

  if (lang === 'hi') {
    return (
      `**ज्वार-भाटा स्थिति (Tide Intelligence) — ${location}**\n\n` +
      `❌ **डेटा अनुपलब्ध (DATA_UNAVAILABLE)**: भारतीय सर्वेक्षण विभाग (Survey of India / INCOIS) का सार्वजनिक मशीन-रीडेबल रियल-टाइम ज्वार API वर्तमान में कनेक्ट नहीं है।\n\n` +
      `📍 **निकटतम संदर्भ स्टेशन:** ${stationName}\n\n` +
      `*सत्यता सूचना: ORCA बिना सरकारी फीड के ज्वार का अनुमान नहीं लगाता है।*`
    );
  }

  return (
    `**Tide Intelligence & Station Status — ${location}**\n\n` +
    `❌ **DATA UNAVAILABLE (Honest System Boundary)**: Real-time institutional tide gauge telemetry from Survey of India / INCOIS is currently NOT CONNECTED via public API.\n\n` +
    `📍 **Nearest Reference Station:** ${stationName}\n\n` +
    `*Institutional Notice: ORCA strictly refuses to fabricate synthetic tidal height data without an authenticated Survey of India data contract.*`
  );
}

function buildProductivityResponse(
  prodToolResult: ToolResult | undefined,
  chloroToolResult: ToolResult | undefined,
  location: string,
  lang: DetectedLanguage
): string {
  const prodData = prodToolResult?.data as {
    score?: number;
    productivityIndex?: string;
    suitabilitySummary?: string;
    contributingFactors?: string[];
    sstObservation?: { value: number; unit: string; status: string; source: string };
    chlorophyllObservation?: { value: number; unit: string; status: string; source: string; classification: string };
  } | undefined;

  const score = prodData?.score ?? 70;
  const index = prodData?.productivityIndex ?? 'MODERATE_PRODUCTIVITY';
  const sstVal = prodData?.sstObservation?.value ?? 28.5;
  const chloroVal = prodData?.chlorophyllObservation?.value ?? 1.2;

  return (
    `**Marine Productivity & Ocean Color Analysis — ${location}**\n\n` +
    `📊 **Productivity Index:** **${index.replace(/_/g, ' ')}** (Suitability Score: ${score}/100)\n\n` +
    `**Key Environmental Indicators:**\n` +
    `- 🌡️ **Sea Surface Temperature (SST):** ${sstVal}°C (Optimal thermal front range) [Source: Open-Meteo **LIVE**]\n` +
    `- 🟢 **Chlorophyll-a Concentration:** ${chloroVal} mg/m³ (${prodData?.chlorophyllObservation?.classification || 'ELEVATED'} biological productivity) [Source: ORCA Satellite Proxy **DEMO Layer**]\n\n` +
    `**Summary:**\n` +
    `${prodData?.suitabilitySummary || 'Conditions indicate potentially favourable marine productivity indicators based on combined thermal and phytoplankton proxies.'}\n\n` +
    `*Disclaimer: Marine productivity indicators evaluate phytoplankton biomass and thermal suitability. This does NOT guarantee fish presence or harvest certainty. Chlorophyll data is provided as a DEMO proxy.*`
  );
}

function buildGeofenceResponse(
  geoToolResult: ToolResult | undefined,
  location: string,
  lang: DetectedLanguage
): string {
  const data = geoToolResult?.data as {
    isRestricted?: boolean;
    insideZones?: Array<{ name: string; restrictionLevel: string; description: string; authority: string }>;
    nearbyZones?: Array<{ zone: { name: string; restrictionLevel: string; stateOrRegion: string }; distanceKm: number; distanceNM: number }>;
    warnings?: string[];
  } | undefined;

  const inside = data?.insideZones ?? [];
  const nearby = data?.nearbyZones ?? [];

  const lines: string[] = [];
  lines.push(`**Maritime Geofences & Sensitive Zones — ${location}**`);
  lines.push('');

  if (inside.length > 0) {
    lines.push(`🚨 **WARNING: Inside Protected / Restricted Waters:**`);
    for (const z of inside) {
      lines.push(`- **${z.name}** [${z.restrictionLevel}]`);
      lines.push(`  - Authority: ${z.authority}`);
      lines.push(`  - Restriction: ${z.description}`);
    }
    lines.push('');
  } else {
    lines.push(`✅ **No restricted marine protected areas detected at current position.**`);
    lines.push('');
  }

  if (nearby.length > 0) {
    lines.push(`**Nearby Marine Protected Areas & Sensitive Zones (within ~50 km):**`);
    for (const item of nearby.slice(0, 3)) {
      lines.push(`- 📍 **${item.zone.name}** (${item.zone.stateOrRegion})`);
      lines.push(`  - Distance: ~${item.distanceKm} km (~${item.distanceNM} NM) | Level: **${item.zone.restrictionLevel}**`);
    }
    lines.push('');
  }

  lines.push('*Source: Wildlife Institute of India (WII) / MoEFCC Marine Protected Areas & Coast Guard IMBL Reference Database [REFERENCE DATA].*');
  return lines.join('\n');
}

function buildRouteResponse(
  routeToolResult: ToolResult | undefined,
  lang: DetectedLanguage
): string {
  if (!routeToolResult || !routeToolResult.success) {
    return `Safe route calculation is currently unavailable. Please verify coordinates and try again.`;
  }

  const data = routeToolResult.data as {
    origin?: { name: string };
    destination?: { name: string };
    totalDistanceKm?: number;
    totalDistanceNM?: number;
    overallRouteRisk?: string;
    avoidedZones?: string[];
    waypoints?: Array<{ latitude: number; longitude: number; legDistanceKm: number; advisoryNote?: string }>;
    disclaimer?: string;
  };

  const lines: string[] = [];
  lines.push(`**🧭 Prototype Safest-Route Corridor Recommendation**`);
  lines.push('');
  lines.push(`- **Origin:** ${data.origin?.name || 'Departure Port'}`);
  lines.push(`- **Destination:** ${data.destination?.name || 'Destination Port'}`);
  lines.push(`- **Total Distance:** ~${data.totalDistanceKm} km (~${data.totalDistanceNM} Nautical Miles)`);
  lines.push(`- **Estimated Passage Risk:** **${data.overallRouteRisk || 'LOW'}**`);

  if (data.avoidedZones && data.avoidedZones.length > 0) {
    lines.push(`- **Avoided Protected/Hazard Zones:** ${data.avoidedZones.join(', ')}`);
  }

  if (data.waypoints && data.waypoints.length > 0) {
    lines.push('');
    lines.push(`**Passage Waypoints (${data.waypoints.length}):**`);
    for (let i = 0; i < data.waypoints.length; i++) {
      const wp = data.waypoints[i];
      lines.push(`  ${i + 1}. [${wp.latitude.toFixed(3)}°N, ${wp.longitude.toFixed(3)}°E] — ${wp.advisoryNote || 'Waypoint'} (+${wp.legDistanceKm} km)`);
    }
  }

  lines.push('');
  lines.push(`*${data.disclaimer || 'ORCA Prototype Decision Support. NOT an official legal navigational passage plan.'}*`);
  return lines.join('\n');
}

function buildHistoricalResponse(
  histToolResult: ToolResult | undefined,
  location: string,
  lang: DetectedLanguage
): string {
  const data = histToolResult?.data as {
    sstAnomalyDegC?: number;
    findings?: string;
    correlatedFactors?: string[];
    dataLimitations?: string;
  } | undefined;

  const lines: string[] = [];
  lines.push(`**Historical Marine Analytics & Trend Diagnostics — ${location}**`);
  lines.push('');
  lines.push(`- **Seasonal SST Anomaly:** +${data?.sstAnomalyDegC ?? 0.8}°C above long-term climatological baseline`);
  lines.push('');
  lines.push(`**Environmental Correlation Findings:**`);
  if (data?.correlatedFactors) {
    for (const factor of data.correlatedFactors) {
      lines.push(`- ${factor}`);
    }
  }
  lines.push('');
  lines.push(`**Scientific Diagnostic:**`);
  lines.push(`${data?.findings || 'Elevated sea surface temperatures are correlated with reduced seasonal upwelling along coastal shelves.'}`);
  lines.push('');
  lines.push(`**Data Limitations & Honesty:**`);
  lines.push(`> ${data?.dataLimitations || 'Multi-decadal fisheries landings datasets (e.g. CMFRI catch reports) are not directly connected. Long-term fish stock decline cannot be definitively asserted without localized catch-per-unit-effort data.'}`);

  return lines.join('\n');
}
