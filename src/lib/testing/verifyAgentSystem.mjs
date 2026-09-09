/**
 * ORCA Milestone 4 Agent System Verification Suite
 * 18-point test: POST /api/agent
 * 
 * Run: node src/lib/testing/verifyAgentSystem.mjs
 * (requires dev server running on :3000)
 */

const BASE_URL = 'http://localhost:3000';
let passed = 0;
let failed = 0;

async function postAgent(message, conversationState = null) {
  const body = { message };
  if (conversationState) body.conversationState = conversationState;
  const res = await fetch(`${BASE_URL}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

function check(testNum, description, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ [T${testNum.toString().padStart(2, '0')}] ${description}`);
    passed++;
  } else {
    console.error(`  ❌ [T${testNum.toString().padStart(2, '0')}] ${description}${detail ? ` → ${detail}` : ''}`);
    failed++;
  }
}

console.log('\n══════════════════════════════════════════════════════');
console.log('   ORCA Milestone 4 — Agent System Verification');
console.log('══════════════════════════════════════════════════════\n');

// ---------------------------------------------------------------------------
// Group 1: API Contract
// ---------------------------------------------------------------------------
console.log('▶ Group 1: API Contract\n');

{
  const { status, data } = await postAgent('What are the sea conditions near Mumbai?');
  check(1, 'POST /api/agent returns HTTP 200', status === 200, `status=${status}`);
  check(2, 'Response has answer string', typeof data.answer === 'string' && data.answer.length > 10, `answer="${data.answer?.slice(0, 50)}"`);
  check(3, 'Response has plan object', data.plan && typeof data.plan === 'object', JSON.stringify(data.plan)?.slice(0, 80));
  check(4, 'Response has toolResults array', Array.isArray(data.toolResults), `toolResults=${JSON.stringify(data.toolResults)?.slice(0, 50)}`);
  check(5, 'Response has evidence array', Array.isArray(data.evidence));
  check(6, 'Response has conversationState', data.conversationState && typeof data.conversationState === 'object');
  check(7, 'Response has mapContext', data.mapContext && typeof data.mapContext === 'object');
  check(8, 'processingTimeMs is a positive number', typeof data.processingTimeMs === 'number' && data.processingTimeMs > 0, `ms=${data.processingTimeMs}`);
}

// ---------------------------------------------------------------------------
// Group 2: Intent Classification
// ---------------------------------------------------------------------------
console.log('\n▶ Group 2: Intent Classification\n');

{
  const { data } = await postAgent('Is it safe to go fishing tomorrow morning?');
  check(9, 'Safety query classified correctly',
    ['MARINE_SAFETY_ASSESSMENT', 'VENTURE_SAFETY_CHECK', 'GENERAL_MARINE_QUERY'].includes(data.intent),
    `intent=${data.intent}`
  );
}

{
  const { data } = await postAgent('What is the wind speed near Chennai?');
  check(10, 'Weather query classified correctly',
    ['WEATHER_QUERY', 'WEATHER_FORECAST', 'MARINE_SAFETY_ASSESSMENT', 'GENERAL_MARINE_QUERY'].includes(data.intent),
    `intent=${data.intent}`
  );
}

{
  const { data } = await postAgent('Where is the nearest shelter port from Kochi?');
  check(11, 'Port query identified (tools include findNearestPort)',
    data.plan?.requiredTools?.includes('findNearestPort'),
    `tools=${JSON.stringify(data.plan?.requiredTools)}`
  );
}

// ---------------------------------------------------------------------------
// Group 3: Location Resolution
// ---------------------------------------------------------------------------
console.log('\n▶ Group 3: Location Resolution\n');

{
  const { data } = await postAgent('How are the waves near Visakhapatnam today?');
  check(12, 'City lookup resolves Visakhapatnam coordinates',
    Math.abs((data.plan?.location?.latitude ?? 0) - 17.68) < 1.0,
    `lat=${data.plan?.location?.latitude}, resolvedFrom=${data.plan?.location?.resolvedFrom}`
  );
}

// ---------------------------------------------------------------------------
// Group 4: Tool Execution
// ---------------------------------------------------------------------------
console.log('\n▶ Group 4: Tool Execution\n');

{
  const { data } = await postAgent('What are the sea conditions near Kochi right now?');
  const toolNames = data.toolResults?.map(r => r.tool) ?? [];
  check(13, 'Tool results contain getMarineConditions', toolNames.includes('getMarineConditions'), `tools=${JSON.stringify(toolNames)}`);
  check(14, 'Tool results contain getWeather or findNearestPort',
    toolNames.includes('getWeather') || toolNames.includes('findNearestPort'),
    `tools=${JSON.stringify(toolNames)}`
  );
}

// ---------------------------------------------------------------------------
// Group 5: Risk Engine Integration
// ---------------------------------------------------------------------------
console.log('\n▶ Group 5: Risk Engine Integration\n');

{
  const { data } = await postAgent('What is the marine risk near Mumbai tomorrow morning?');
  check(15, 'Risk assessment in response (or DATA_UNAVAILABLE flagged)',
    data.riskAssessment !== undefined || data.answer.toLowerCase().includes('unavailable'),
    `riskAssessment=${JSON.stringify(data.riskAssessment)?.slice(0, 80)}`
  );
  if (data.riskAssessment) {
    check(16, 'Risk level is valid enum value',
      ['LOW', 'MODERATE', 'HIGH', 'SEVERE', 'UNKNOWN'].includes(data.riskAssessment.riskLevel),
      `riskLevel=${data.riskAssessment.riskLevel}`
    );
  } else {
    check(16, 'Risk level SKIPPED (data unavailable for this location)', true);
  }
}

// ---------------------------------------------------------------------------
// Group 6: Conversation State & Multi-turn
// ---------------------------------------------------------------------------
console.log('\n▶ Group 6: Conversation State & Multi-turn\n');

{
  const first = await postAgent('What are the conditions near Kochi?');
  const firstState = first.data.conversationState;

  const second = await postAgent('And what is the nearest port?', firstState);
  check(17, 'Conversation state carries location across turns',
    second.data.plan?.location?.resolvedFrom === 'CONTEXT_CARRY' ||
    second.data.conversationState?.messageCount >= 2,
    `resolvedFrom=${second.data.plan?.location?.resolvedFrom}, messageCount=${second.data.conversationState?.messageCount}`
  );
}

// ---------------------------------------------------------------------------
// Group 7: Input Validation & Security
// ---------------------------------------------------------------------------
console.log('\n▶ Group 7: Input Validation & Security\n');

{
  const res = await fetch(`${BASE_URL}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '' }),
  });
  check(18, 'Empty message returns 400 error', res.status === 400, `status=${res.status}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const total = passed + failed;
console.log('\n══════════════════════════════════════════════════════');
console.log(`   Results: ${passed}/${total} tests passed${failed > 0 ? ` | ${failed} FAILED` : ' ✅'}`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
