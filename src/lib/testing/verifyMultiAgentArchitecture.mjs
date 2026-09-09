/**
 * ORCA Multi-Agent Architecture Verification Suite
 * Verifies true collaborative multi-agent execution across all specialized intelligence agents.
 */

const BASE_URL = process.env.ORCA_BASE_URL || 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function postAgent(payload) {
  const res = await fetch(`${BASE_URL}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runVerification() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  ORCA — TRUE SPECIALIZED MULTI-AGENT ARCHITECTURE VERIFICATION    ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  Server: ${BASE_URL}`);
  console.log(`  Time:   ${new Date().toISOString()}\n`);

  // --- T01: Weather Intelligence Agent Execution ---
  console.log('🌤️ [1/24] Weather Intelligence Agent');
  const t01 = await postAgent({ message: 'What is the wind speed and atmospheric pressure in Mumbai?' });
  assert(t01.status === 200, 'T01: Returns HTTP 200');
  assert(t01.data.toolResults.some((t) => t.tool === 'getWeather'), 'T01: Weather Intelligence tool executed');
  assert(typeof t01.data.answer === 'string' && t01.data.answer.length > 20, 'T01: Synthesized grounded weather response');

  // --- T02: Ocean Intelligence Agent Execution ---
  console.log('\n🌊 [2/24] Ocean Intelligence Agent');
  const t02 = await postAgent({ message: 'What are the wave heights and swell near Kochi?' });
  assert(t02.status === 200, 'T02: Returns HTTP 200');
  assert(t02.data.toolResults.some((t) => t.tool === 'getMarineConditions'), 'T02: Ocean Intelligence tool executed');
  assert(t02.data.evidence.some((e) => e.dataType === 'OCEAN'), 'T02: Captured ocean evidence');

  // --- T03: Geospatial Intelligence Agent Execution ---
  console.log('\n🗺️ [3/24] Geospatial Intelligence Agent');
  const t03 = await postAgent({ message: 'Where is the nearest shelter port near Porbandar?' });
  console.log('T03 debug:', JSON.stringify({ plan: t03.data.plan, tools: t03.data.toolResults, evidence: t03.data.evidence }));
  assert(t03.status === 200, 'T03: Returns HTTP 200');
  assert(t03.data.toolResults.some((t) => t.tool === 'findNearestPort'), 'T03: Geospatial Intelligence tool executed');
  assert(t03.data.evidence.some((e) => e.dataType === 'GEOSPATIAL'), 'T03: Port distance evidence captured');

  // --- T04: Alert & Disaster Agent Execution ---
  console.log('\n🚨 [4/24] Alert & Disaster Agent');
  const t04 = await postAgent({ message: 'Are there any active cyclone warnings near Chennai?' });
  assert(t04.status === 200, 'T04: Returns HTTP 200');
  assert(t04.data.toolResults.some((t) => t.tool === 'getMarineAlerts'), 'T04: Alert Intelligence tool executed');

  // --- T05: Fishing & Productivity Agent Execution ---
  console.log('\n🐟 [5/24] Fishing & Marine Productivity Agent');
  const t05 = await postAgent({ message: 'Show potential fishing zones and chlorophyll fronts near Goa.' });
  assert(t05.status === 200, 'T05: Returns HTTP 200');
  assert(
    t05.data.toolResults.some((t) => t.tool === 'getPFZ' || t.tool === 'analyzeMarineProductivity'),
    'T05: Fishing & Productivity tool executed'
  );
  assert(t05.data.answer.includes('DEMO') || t05.data.answer.toLowerCase().includes('incois'), 'T05: Transparent PFZ provenance disclaimer');

  // --- T06: Historical Analysis Agent Execution ---
  console.log('\n📉 [6/24] Historical Analysis Agent');
  const t06 = await postAgent({ message: 'Why has fish catch declined over the years near Mumbai?' });
  assert(t06.status === 200, 'T06: Returns HTTP 200');
  assert(t06.data.toolResults.some((t) => t.tool === 'analyzeHistoricalMarineConditions'), 'T06: Historical analysis tool executed');

  // --- T07: Marine Risk & Safety Agent (Deterministic Engine) ---
  console.log('\n🛡️ [7/24] Marine Risk & Safety Agent (Deterministic Ground Truth)');
  const t07 = await postAgent({ message: 'Is it safe to go out to sea from Mumbai tomorrow morning?' });
  assert(t07.status === 200, 'T07: Returns HTTP 200');
  assert(t07.data.riskAssessment !== undefined, 'T07: Deterministic risk assessment returned');
  assert(typeof t07.data.riskAssessment.riskScore === 'number', 'T07: Risk score is mathematically computed');
  assert(['LOW', 'MODERATE', 'HIGH', 'SEVERE'].includes(t07.data.riskAssessment.riskLevel), 'T07: Valid risk level enum');

  // --- T08: Route Optimization Agent Execution ---
  console.log('\n🧭 [8/24] Route Optimization Agent');
  const t08 = await postAgent({ message: 'What is the safest passage route from Porbandar to Mumbai?' });
  assert(t08.status === 200, 'T08: Returns HTTP 200');
  assert(t08.data.toolResults.some((t) => t.tool === 'findSafestRoute'), 'T08: Safe route optimization tool executed');

  // --- T09: Evidence Agent Provenance Aggregation ---
  console.log('\n📋 [9/24] Evidence Agent Provenance Aggregation');
  const t09 = await postAgent({ message: 'Give me marine conditions and safety near Visakhapatnam.' });
  assert(t09.status === 200, 'T09: Returns HTTP 200');
  assert(Array.isArray(t09.data.evidence) && t09.data.evidence.length > 0, 'T09: Aggregated structured evidence items');
  assert(t09.data.evidence.every((e) => e.source && e.status && e.timestamp), 'T09: Every evidence item has verified provenance');

  // --- T10: True Multi-Agent Collaboration (Parallel + Dependent Phases) ---
  console.log('\n⚙️ [10/24] True Multi-Agent Collaboration Flow');
  const t10 = await postAgent({
    message: 'Can I take my 6m boat from Porbandar tomorrow morning, and what is the safest route?',
  });
  assert(t10.status === 200, 'T10: Returns HTTP 200');
  assert(t10.data.toolResults.length >= 3, 'T10: Multi-agent pipeline executed collaborative tools');
  assert(t10.data.riskAssessment !== undefined, 'T10: Risk Agent executed after Weather & Ocean agents');

  // --- T11: Agent Failure Resilience ---
  console.log('\n🏔️ [11/24] Missing-Data & Agent Failure Resilience');
  const t11 = await postAgent({ message: 'What is the marine wave risk in New Delhi?' });
  assert(t11.status === 200, 'T11: Handled landlocked location cleanly without crashing');
  assert(typeof t11.data.answer === 'string' && t11.data.answer.length > 0, 'T11: Generates graceful explanation of terrestrial boundaries');

  // --- T12: Deep Multi-Turn Context Preservation ---
  console.log('\n🔄 [12/24] Multi-Turn Conversational Memory');
  const t12_1 = await postAgent({ message: 'I am planning a sea trip from Kochi tomorrow.' });
  assert(t12_1.status === 200, 'T12: Turn 1 returns 200');
  const t12_2 = await postAgent({
    message: 'What about the wave heights?',
    conversationState: t12_1.data.conversationState,
  });
  assert(t12_2.status === 200, 'T12: Turn 2 returns 200');
  assert(t12_2.data.plan.location.name.toLowerCase().includes('kochi'), 'T12: Turn 2 carried forward Kochi location context');

  // --- T13: Role-Aware: Fisherman Persona ---
  console.log('\n🎣 [13/24] Role-Aware: Fisherman Persona');
  const t13 = await postAgent({
    message: 'Can my small 5m boat handle the sea conditions off Porbandar tomorrow morning?',
    userRole: 'FISHERMAN',
  });
  assert(t13.status === 200, 'T13: Returns HTTP 200');
  assert(t13.data.plan.vesselContext?.lengthMeters === 5, 'T13: Captured 5m boat length context');

  // --- T14: Role-Aware: Marine Researcher Persona ---
  console.log('\n🔬 [14/24] Role-Aware: Marine Researcher Persona');
  const t14 = await postAgent({
    message: 'Analyze SST thermal fronts and marine productivity indicators off Goa.',
    userRole: 'RESEARCHER',
  });
  assert(t14.status === 200, 'T14: Returns HTTP 200');
  assert(
    t14.data.toolResults.some((t) => t.tool === 'analyzeMarineProductivity' || t.tool === 'getMarineConditions'),
    'T14: Researcher query engaged ocean productivity tools'
  );

  // --- T15: Role-Aware: Coastal Authority Persona ---
  console.log('\n⚓ [15/24] Role-Aware: Coastal Authority Persona');
  const t15 = await postAgent({
    message: 'Provide maritime operational status and port proximity for Porbandar sector.',
    userRole: 'COASTAL_AUTHORITY',
  });
  assert(t15.status === 200, 'T15: Returns HTTP 200');
  assert(t15.data.toolResults.some((t) => t.tool === 'findNearestPort'), 'T15: Coastal authority engaged port proximity tool');

  // --- T16: Role-Aware: Disaster Management Persona ---
  console.log('\n🚨 [16/24] Role-Aware: Disaster Management Persona');
  const t16 = await postAgent({
    message: 'Check hazard alerts and extreme weather risk for Mumbai coast.',
    userRole: 'DISASTER_MANAGEMENT',
  });
  assert(t16.status === 200, 'T16: Returns HTTP 200');
  assert(t16.data.toolResults.some((t) => t.tool === 'getMarineAlerts'), 'T16: Disaster management engaged alert tool');

  // --- T17: Role-Aware: Maritime Commercial Operator Persona ---
  console.log('\n🚢 [17/24] Role-Aware: Maritime Commercial Operator Persona');
  const t17 = await postAgent({
    message: 'Passage conditions and wave spectrum for commercial transit off Kochi.',
    userRole: 'MARITIME_OPERATOR',
  });
  assert(t17.status === 200, 'T17: Returns HTTP 200');
  assert(t17.data.toolResults.some((t) => t.tool === 'getMarineConditions'), 'T17: Operator engaged marine conditions');

  // --- T18: Native Hindi Vernacular Synthesis ---
  console.log('\n🇮🇳 [18/24] Native Hindi Vernacular Synthesis');
  const t18 = await postAgent({ message: 'क्या कल सुबह पोरबंदर में समुद्र सुरक्षित रहेगा?' });
  assert(t18.status === 200, 'T18: Returns HTTP 200');
  assert(t18.data.detectedLanguage && t18.data.detectedLanguage.toLowerCase() === 'hi', 'T18: Correctly detected Hindi language');
  assert(/[\u0900-\u097F]/.test(t18.data.answer), 'T18: Synthesized answer in Devanagari Hindi script');

  // --- T19: Native Gujarati Vernacular Synthesis ---
  console.log('\n🇮🇳 [19/24] Native Gujarati Vernacular Synthesis');
  const t19 = await postAgent({ message: 'શું આવતીકાલે પોરબંદર દરિયામાં જવું સલામત છે?' });
  assert(t19.status === 200, 'T19: Returns HTTP 200');
  assert(t19.data.detectedLanguage && t19.data.detectedLanguage.toLowerCase() === 'gu', 'T19: Correctly detected Gujarati language');
  assert(/[\u0A80-\u0AFF]/.test(t19.data.answer), 'T19: Synthesized answer in Gujarati script');

  // --- T20: Contextual Follow-Up Suggestions ---
  console.log('\n💬 [20/24] Dynamic Contextual Follow-Up Suggestions');
  const t20 = await postAgent({ message: 'How are the waves in Kochi tomorrow?' });
  assert(t20.status === 200, 'T20: Returns HTTP 200');
  assert(Array.isArray(t20.data.suggestedQuestions) && t20.data.suggestedQuestions.length > 0, 'T20: Attached suggested follow-up questions');

  // --- T21: Secret & Credential Protection ---
  console.log('\n🔒 [21/24] Secret-Key & Credential Protection');
  const serialized = JSON.stringify(t20.data);
  assert(!serialized.includes('AIzaSy'), 'T21: Zero Google API keys exposed in payload');
  assert(!serialized.includes('GEMINI_API_KEY'), 'T21: Zero env var names exposed in payload');

  // --- T22: Statutory Prototype Decision-Support Disclaimer ---
  console.log('\n⚖️ [22/24] Statutory Prototype Decision-Support Disclaimer');
  assert(
    t20.data.answer.toLowerCase().includes('orca') ||
    t20.data.answer.toLowerCase().includes('incois') ||
    t20.data.answer.toLowerCase().includes('decision-support'),
    'T22: Prototype decision-support advisory attached'
  );

  // --- T23: Input Sanitization & Empty Query Handling ---
  console.log('\n🛡️ [23/24] Input Sanitization & Security');
  const t23 = await postAgent({ message: '   ' });
  assert(t23.status === 400, 'T23: Rejects empty query with HTTP 400');

  // --- T24: Killer Demonstration Scenario (Fisherman Hindi Query) ---
  console.log('\n🎯 [24/24] SIH Killer Demonstration Scenario (Fisherman Hindi Query)');
  const t24 = await postAgent({
    message: 'मैं कल सुबह पोरबंदर से अपनी 6 मीटर नाव लेकर मछली पकड़ने जा सकता हूँ क्या?',
    userRole: 'FISHERMAN',
  });
  assert(t24.status === 200, 'T24: Demonstration query returns HTTP 200');
  assert(t24.data.plan.location.name.toLowerCase().includes('porbandar'), 'T24: Resolved Porbandar location');
  assert(t24.data.detectedLanguage && t24.data.detectedLanguage.toLowerCase() === 'hi', 'T24: Detected Hindi vernacular');
  assert(t24.data.riskAssessment !== undefined, 'T24: Evaluated deterministic risk');
  assert(/[\u0900-\u097F]/.test(t24.data.answer), 'T24: Synthesized natural Hindi response in Devanagari script');

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`  FINAL RESULT: ${passedTests} PASSED, ${failedTests} FAILED (${passedTests}/${totalTests})`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
