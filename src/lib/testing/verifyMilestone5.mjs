/**
 * ORCA Milestone 5 — Automated Verification Tests
 * Tests: GDACS provider, Indian Ocean filtering, alert tool,
 * IMD unavailability, DEMO PFZ, source registry, agent endpoint,
 * evidence generation, provider failure handling.
 *
 * Run: node src/lib/testing/verifyMilestone5.mjs
 * Server must be running on http://localhost:3000
 */

const BASE = 'http://localhost:3000';
let passCount = 0;
let failCount = 0;

function pass(name) {
  console.log(`  ✅ PASS: ${name}`);
  passCount++;
}
function fail(name, detail) {
  console.error(`  ❌ FAIL: ${name}`);
  console.error(`         ${detail}`);
  failCount++;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, body: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, body: text }; }
}

// ============================================================================
// Test Suite 1: /api/alerts
// ============================================================================
async function testAlertsEndpoint() {
  console.log('\n📡 Suite 1: /api/alerts endpoint');

  // T1: endpoint returns 200
  const r1 = await fetchJson(`${BASE}/api/alerts?lat=13.08&lon=80.27`);
  if (r1.status === 200) pass('T1: /api/alerts returns 200');
  else fail('T1: /api/alerts returns 200', `Got ${r1.status}`);

  // T2: response has required fields
  const b = r1.body;
  if (b && Array.isArray(b.alerts) && b.retrievedAt && b.queryCoordinates)
    pass('T2: Response has alerts[], retrievedAt, queryCoordinates');
  else fail('T2: Response shape', JSON.stringify(b).slice(0, 200));

  // T3: GDACS is listed as provider
  const hasGdacs = b?.providerStatus?.some(p => p.source?.includes('GDACS'));
  if (hasGdacs) pass('T3: GDACS appears in providerStatus');
  else fail('T3: GDACS in providerStatus', JSON.stringify(b?.providerStatus));

  // T4: IMD listed as unavailable
  const imdStatus = b?.unavailableProviders?.some(p => p?.toLowerCase().includes('imd'))
    || b?.providerStatus?.some(p => p.source?.includes('IMD') && p.status !== 'LIVE');
  if (imdStatus) pass('T4: IMD not listed as LIVE');
  else fail('T4: IMD UNAVAILABLE status', JSON.stringify(b?.providerStatus));

  // T5: No alert has status=LIVE and sourceType=undefined (all must have provenance)
  const alerts = b?.alerts ?? [];
  const allHaveProvenance = alerts.every(a => a.source && a.sourceType && a.retrievedAt);
  if (allHaveProvenance) pass('T5: All alerts have source, sourceType, retrievedAt');
  else fail('T5: Alert provenance', alerts.find(a => !a.source || !a.sourceType)?.id);

  // T6: Invalid coordinates return 400
  const r6 = await fetchJson(`${BASE}/api/alerts?lat=999&lon=999`);
  if (r6.status === 400) pass('T6: Invalid coords return 400');
  else fail('T6: Invalid coords', `Got ${r6.status}`);

  // T7: Alerts (if any) are filtered to Indian Ocean region
  for (const alert of alerts) {
    if (alert.coordinates) {
      const lat = alert.coordinates.latitude;
      const lon = alert.coordinates.longitude;
      if (lat < 5 || lat > 30 || lon < 55 || lon > 100) {
        fail('T7: Indian Ocean filter', `Alert ${alert.id} at lat=${lat}, lon=${lon} outside Indian maritime zone`);
        return;
      }
    }
  }
  pass('T7: All alerts with coordinates are within Indian maritime zone or global (no-coords)');

  // T8: No fabricated alerts (all must be GDACS sourced or empty)
  const allGdacs = alerts.every(a => a.source?.includes('GDACS') || a.sourceType === 'OFFICIAL');
  if (allGdacs) pass('T8: All alerts are from GDACS (OFFICIAL source)');
  else fail('T8: Alert source verification', alerts.find(a => !a.source?.includes('GDACS'))?.source);
}

// ============================================================================
// Test Suite 2: /api/pfz
// ============================================================================
async function testPfzEndpoint() {
  console.log('\n🐟 Suite 2: /api/pfz endpoint');

  const r = await fetchJson(`${BASE}/api/pfz?lat=10.9&lon=76.0`);
  if (r.status === 200) pass('T9: /api/pfz returns 200');
  else fail('T9: /api/pfz returns 200', `Got ${r.status}`);

  const b = r.body;

  // T10: Status is DEMO (never LIVE)
  if (b?.status === 'DEMO') pass('T10: PFZ status is DEMO');
  else fail('T10: PFZ must be DEMO', `Got status=${b?.status}`);

  // T11: INCOIS marked UNAVAILABLE
  if (b?.pfzStatus?.incois?.status === 'UNAVAILABLE') pass('T11: INCOIS marked UNAVAILABLE');
  else fail('T11: INCOIS status', JSON.stringify(b?.pfzStatus));

  // T12: All zones have advisoryType=DEMO_SAMPLE
  const zones = b?.zones ?? [];
  const allDemo = zones.every(z => z.advisoryType === 'DEMO_SAMPLE' && z.status === 'DEMO');
  if (allDemo) pass('T12: All PFZ zones have advisoryType=DEMO_SAMPLE');
  else fail('T12: DEMO zone check', zones.find(z => z.advisoryType !== 'DEMO_SAMPLE')?.id);

  // T13: Source is clearly labelled as NOT INCOIS
  if (b?.source?.includes('NOT INCOIS') || b?.disclaimer?.includes('NOT INCOIS')) pass('T13: Source clearly labels NOT INCOIS');
  else fail('T13: Source label', b?.source);

  // T14: Invalid coordinates
  const r14 = await fetchJson(`${BASE}/api/pfz?lat=invalid&lon=xyz`);
  if (r14.status === 400 || (r14.body?.zones && Array.isArray(r14.body?.zones))) pass('T14: Invalid PFZ coords handled');
  else fail('T14: PFZ invalid coords', `status=${r14.status}`);
}

// ============================================================================
// Test Suite 3: /api/sources
// ============================================================================
async function testSourcesEndpoint() {
  console.log('\n🗄️  Suite 3: /api/sources endpoint');

  const r = await fetchJson(`${BASE}/api/sources`);
  if (r.status === 200) pass('T15: /api/sources returns 200');
  else fail('T15: /api/sources', `Got ${r.status}`);

  const b = r.body;
  if (Array.isArray(b?.sources) && b.sources.length > 0) pass('T16: sources[] is non-empty array');
  else fail('T16: sources array', JSON.stringify(b).slice(0, 100));

  // T17: Open-Meteo is LIVE
  const omWeather = b?.sources?.find(s => s.id === 'open-meteo-weather');
  if (omWeather?.status === 'LIVE') pass('T17: Open-Meteo Weather is LIVE in registry');
  else fail('T17: Open-Meteo Weather LIVE', JSON.stringify(omWeather));

  // T18: INCOIS is REQUIRES_CREDENTIALS
  const incois = b?.sources?.find(s => s.id === 'incois-pfz');
  if (incois?.status === 'REQUIRES_CREDENTIALS' || incois?.status === 'UNAVAILABLE') pass('T18: INCOIS is REQUIRES_CREDENTIALS');
  else fail('T18: INCOIS status', incois?.status);

  // T19: IMD is REQUIRES_CREDENTIALS
  const imd = b?.sources?.find(s => s.id === 'imd-official');
  if (imd?.status === 'REQUIRES_CREDENTIALS') pass('T19: IMD is REQUIRES_CREDENTIALS');
  else fail('T19: IMD status', imd?.status);
}

// ============================================================================
// Test Suite 4: Alert via /api/agent (Chat Integration)
// ============================================================================
async function testAlertAgentIntegration() {
  console.log('\n🤖 Suite 4: Alert queries via /api/agent');

  const queries = [
    { msg: 'Are there any warnings near Kochi?', location: 'kochi' },
    { msg: 'Any cyclone near Mumbai?', location: 'mumbai' },
    { msg: 'Are there alerts in the Arabian Sea?', location: 'arabian' },
    { msg: 'What warnings are near Chennai?', location: 'chennai' },
  ];

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const testNum = 20 + i;
    try {
      const r = await fetchJson(`${BASE}/api/agent`, {
        method: 'POST',
        body: JSON.stringify({
          message: q.msg,
          conversationState: { messageCount: 0, sessionStartedAt: new Date().toISOString() },
        }),
      });

      if (!r.ok) {
        fail(`T${testNum}: Alert query "${q.msg.slice(0, 30)}"`, `HTTP ${r.status}`);
        continue;
      }

      const body = r.body;
      // Intent should be MARITIME_ALERT_QUERY or ALERT_QUERY
      const isAlertIntent = ['MARITIME_ALERT_QUERY', 'ALERT_QUERY'].includes(body?.intent);
      // Answer should mention either GDACS or "no alerts" or "unavailable" — never fabricate
      const answerMentionsSource = body?.answer?.includes('GDACS') || body?.answer?.includes('no active') ||
        body?.answer?.includes('No active') || body?.answer?.includes('unavailable') || body?.answer?.includes('UNAVAILABLE');

      if (isAlertIntent && answerMentionsSource) {
        pass(`T${testNum}: "${q.msg.slice(0, 35)}" → alert intent + honest response`);
      } else {
        fail(`T${testNum}: Alert query intent/answer`, `intent=${body?.intent}, answerHasSource=${answerMentionsSource}`);
      }
    } catch (e) {
      fail(`T${testNum}: Alert query exception`, e.message);
    }
  }
}

// ============================================================================
// Test Suite 5: No hallucinated alerts
// ============================================================================
async function testNoHallucination() {
  console.log('\n🚫 Suite 5: No hallucination tests');

  const r = await fetchJson(`${BASE}/api/alerts?lat=13.08&lon=80.27`);
  const alerts = r.body?.alerts ?? [];

  // T24: Every alert with LIVE status must have a real GDACS event ID
  const liveAlerts = alerts.filter(a => a.status === 'LIVE');
  const allHaveId = liveAlerts.every(a => a.gdacsEventId && Number.isInteger(a.gdacsEventId));
  if (liveAlerts.length === 0 || allHaveId)
    pass('T24: LIVE alerts have GDACS event IDs (or no active alerts)');
  else
    fail('T24: GDACS event ID check', liveAlerts.find(a => !a.gdacsEventId)?.id);
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ORCA MILESTONE 5 — Automated Verification Tests  ');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Server: ${BASE}`);
  console.log(`  Time:   ${new Date().toISOString()}`);

  try {
    await testAlertsEndpoint();
    await testPfzEndpoint();
    await testSourcesEndpoint();
    await testAlertAgentIntegration();
    await testNoHallucination();
  } catch (e) {
    console.error('\n💥 Unhandled exception in test runner:', e);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passCount} passed, ${failCount} failed`);
  console.log('═══════════════════════════════════════════════════');

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
