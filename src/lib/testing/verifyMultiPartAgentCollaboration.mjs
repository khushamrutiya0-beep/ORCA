/**
 * ORCA — Multi-Part Agent Collaboration & Comprehensive Integration Verification Suite
 * 
 * Verifies that complex multi-part marine queries execute the complete collaborative
 * multi-agent pipeline (Planner -> Weather + Ocean + Geospatial + Alerts -> Risk -> Route -> Evidence -> Synthesis)
 * and yield ONE unified, personalized, grounded answer covering ALL requested aspects.
 * Also verifies simple queries remain strictly isolated to necessary agents only.
 */

const BASE_URL = process.env.ORCA_TEST_URL || 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message} ${detail ? `(${detail})` : ''}`);
  }
}

async function postAgent(message, conversationState = null, userRole = null) {
  const body = { message };
  if (conversationState) body.conversationState = conversationState;
  if (userRole) body.userRole = userRole;

  const res = await fetch(`${BASE_URL}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runVerification() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  ORCA — MULTI-PART AGENT COLLABORATION & INTEGRATION VERIFICATION  ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  Server: ${BASE_URL}`);
  console.log(`  Time:   ${new Date().toISOString()}\n`);

  // =========================================================================
  // TEST SCENARIO 1: The Master Multi-Part Query
  // =========================================================================
  console.log('🚢 [1/3] Master Multi-Part Query: Safety + Sea Conditions + Hazards + Route');
  const complexQuery = 'I have an 8 meter motorized fishing boat. Is it safe to leave Porbandar tomorrow morning, what are the sea conditions, are there any nearby hazards, and what is the safest route?';
  
  const t1 = await postAgent(complexQuery);
  assert(t1.status === 200, 'T01: Returns HTTP 200 for master multi-part query');

  const plan = t1.data?.plan;
  const toolResults = t1.data?.toolResults || [];
  const answer = t1.data?.answer || '';
  const agentExecution = t1.data?.agentExecution || [];
  const executedAgents = agentExecution.map(a => a.agent);

  // 1. Planner decomposition
  assert(plan?.location?.name?.toLowerCase().includes('porbandar'), 'T01: Planner resolved Porbandar location', `location=${plan?.location?.name}`);
  assert(plan?.time?.windowKey === 'tomorrow_morning', 'T01: Planner resolved tomorrow morning time window', `time=${plan?.time?.windowKey}`);
  assert(plan?.vesselContext?.lengthMeters === 8 || plan?.vesselContext?.vesselType?.includes('8'), 'T01: Planner captured 8m vessel profile', `vessel=${JSON.stringify(plan?.vesselContext)}`);

  // 2. All required specialized agents executed
  assert(executedAgents.includes('Weather Intelligence Agent'), 'T01: Weather Intelligence Agent executed in Phase 1');
  assert(executedAgents.includes('Ocean Intelligence Agent'), 'T01: Ocean Intelligence Agent executed in Phase 1');
  assert(executedAgents.includes('Geospatial Intelligence Agent'), 'T01: Geospatial Intelligence Agent executed in Phase 1');
  assert(executedAgents.includes('Alert & Disaster Agent'), 'T01: Alert & Disaster Agent executed in Phase 1');
  assert(executedAgents.includes('Marine Risk & Safety Agent'), 'T01: Marine Risk & Safety Agent executed in Phase 2');
  assert(executedAgents.includes('Route Optimization Agent'), 'T01: Route Optimization Agent executed in Phase 3');

  // 3. Tool results completeness
  const toolNames = toolResults.map(t => t.tool);
  assert(toolNames.includes('getWeather'), 'T01: Tool results contain getWeather');
  assert(toolNames.includes('getMarineConditions'), 'T01: Tool results contain getMarineConditions');
  assert(toolNames.includes('findNearestPort'), 'T01: Tool results contain findNearestPort');
  assert(toolNames.includes('getMarineAlerts'), 'T01: Tool results contain getMarineAlerts');
  assert(toolNames.includes('getGeofences'), 'T01: Tool results contain getGeofences');
  assert(toolNames.includes('findSafestRoute'), 'T01: Tool results contain findSafestRoute');

  // 4. Unified Synthesis covers ALL dimensions (not just route)
  assert(/safety|risk|सुरक्षा|जोखिम/i.test(answer), 'T01: Synthesis answers safety assessment');
  assert(/weather|wind|hpa|km\/h|हवा|मौसम/i.test(answer), 'T01: Synthesis answers weather conditions');
  assert(/wave|sea condition|ocean|sst|लहर|मोजा/i.test(answer), 'T01: Synthesis answers sea/ocean conditions');
  assert(/hazard|alert|cyclone|warning|चेतावनी|ખતરો/i.test(answer), 'T01: Synthesis answers hazards & disaster alerts');
  assert(/port|porbandar|बंदरगाह|બંદર/i.test(answer), 'T01: Synthesis answers port/geospatial context');
  assert(/route|passage|waypoint|corridor|मार्ग|રસ્તો/i.test(answer), 'T01: Synthesis answers safest route corridor');
  assert(/8(\.0)?\s*m|motorized|boat|नाव|બોટ/i.test(answer), 'T01: Synthesis explicitly personalizes for 8m motorized boat');
  assert(/disclaimer|incois|imd|prototype/i.test(answer), 'T01: Prototype decision-support advisory attached');

  // =========================================================================
  // TEST SCENARIO 2: Simple Query Isolation
  // =========================================================================
  console.log('\n🎯 [2/3] Simple Query Isolation: Ensuring minimal agent activation');

  // Weather query only
  const tw = await postAgent('What is the wind speed in Kochi?');
  assert(tw.status === 200, 'T02: Simple weather query returns HTTP 200');
  const twAgents = (tw.data?.agentExecution || []).map(a => a.agent);
  assert(twAgents.includes('Weather Intelligence Agent'), 'T02: Weather agent activated');
  assert(!twAgents.includes('Route Optimization Agent'), 'T02: Route agent NOT unnecessarily invoked for weather query');
  assert(!twAgents.includes('Fishing & Productivity Agent'), 'T02: Fishing agent NOT unnecessarily invoked');

  // Waves query only
  const to = await postAgent('What are the waves near Mumbai?');
  assert(to.status === 200, 'T03: Simple ocean query returns HTTP 200');
  const toAgents = (to.data?.agentExecution || []).map(a => a.agent);
  assert(toAgents.includes('Ocean Intelligence Agent'), 'T03: Ocean agent activated');
  assert(!toAgents.includes('Route Optimization Agent'), 'T03: Route agent NOT unnecessarily invoked for waves query');

  // Cyclone alert query only
  const ta = await postAgent('Are there any cyclone alerts near Gujarat?');
  assert(ta.status === 200, 'T04: Cyclone alert query returns HTTP 200');
  const taAgents = (ta.data?.agentExecution || []).map(a => a.agent);
  assert(taAgents.includes('Alert & Disaster Agent'), 'T04: Alert agent activated');

  // Pure route query
  const tr = await postAgent('Find the safest route from Porbandar to Mumbai');
  assert(tr.status === 200, 'T05: Route query returns HTTP 200');
  const trAgents = (tr.data?.agentExecution || []).map(a => a.agent);
  assert(trAgents.includes('Route Optimization Agent'), 'T05: Route agent activated');

  // =========================================================================
  // TEST SCENARIO 3: Conversational Memory with Multi-Turn Vessel Context
  // =========================================================================
  console.log('\n🔄 [3/3] Conversational Memory & Personalization Retention');

  const turn1 = await postAgent('My boat is 8 meters and I operate from Porbandar.');
  assert(turn1.status === 200, 'T06: Turn 1 returns HTTP 200');
  const turn1State = turn1.data?.conversationState;
  assert(turn1State?.currentLocation?.name?.toLowerCase().includes('porbandar'), 'T06: Turn 1 saved Porbandar location');
  assert(turn1State?.vesselLengthMeters === 8, 'T06: Turn 1 saved 8m vessel length');

  const turn2 = await postAgent('Is it safe tomorrow morning, what are the waves, and what route should I take?', turn1State);
  assert(turn2.status === 200, 'T07: Turn 2 returns HTTP 200');
  assert(turn2.data?.plan?.location?.name?.toLowerCase().includes('porbandar'), 'T07: Turn 2 carried forward Porbandar without re-asking');
  assert(turn2.data?.plan?.time?.windowKey === 'tomorrow_morning', 'T07: Turn 2 resolved tomorrow morning');
  assert(turn2.data?.plan?.vesselContext?.lengthMeters === 8, 'T07: Turn 2 retained 8m vessel context');
  assert(/8(\.0)?\s*m|motorized|नाव|બોટ/i.test(turn2.data?.answer), 'T07: Turn 2 synthesized answer with 8m vessel personalization');

  // =========================================================================
  // FINAL SUMMARY
  // =========================================================================
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`  FINAL RESULT: ${passedTests} PASSED, ${failedTests} FAILED (${passedTests}/${totalTests})`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
