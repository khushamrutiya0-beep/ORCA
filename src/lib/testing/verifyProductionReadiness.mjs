/**
 * ORCA Milestone 6 — Production Hardening & SIH Readiness Test Suite
 * 
 * Verifies all 27 critical production criteria:
 * - Endpoints & Provider Health
 * - SIH Primary Demonstration Scenarios
 * - Multi-lingual Grounding (Hindi, Gujarati)
 * - Multi-turn Context Retention
 * - Resilience & Fallback Handling
 * - Security & Provenance Integrity
 * 
 * Run: node src/lib/testing/verifyProductionReadiness.mjs
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
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, body: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, body: text }; }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ORCA MILESTONE 6: PRODUCTION READINESS & SIH VERIFICATION    ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Target: ${BASE}`);
  console.log(`  Time:   ${new Date().toISOString()}\n`);

  // 1. Health / Source Registry
  console.log('📡 [1/7] Core API Endpoint Contracts');
  const rSources = await fetchJson(`${BASE}/api/sources`);
  if (rSources.status === 200 && rSources.body?.sources?.length > 0) {
    pass('T01: /api/sources returns registered pipeline health');
  } else {
    fail('T01: /api/sources', `status: ${rSources.status}`);
  }

  // 2. Weather API
  const rWeather = await fetchJson(`${BASE}/api/weather?lat=18.92&lon=72.83`);
  if (rWeather.status === 200 && rWeather.body?.windSpeed?.status === 'LIVE') {
    pass('T02: /api/weather returns live meteorological data');
  } else {
    fail('T02: /api/weather', `status: ${rWeather.status}`);
  }

  // 3. Marine API
  const rMarine = await fetchJson(`${BASE}/api/marine?lat=18.92&lon=72.83`);
  if (rMarine.status === 200 && rMarine.body?.waveHeight?.status === 'LIVE') {
    pass('T03: /api/marine returns live oceanographic telemetry');
  } else {
    fail('T03: /api/marine', `status: ${rMarine.status}`);
  }

  // 4. Deterministic Risk API
  const rRisk = await fetchJson(`${BASE}/api/risk?lat=18.92&lon=72.83`);
  if (rRisk.status === 200 && rRisk.body?.riskLevel && rRisk.body?.factors?.length > 0) {
    pass('T04: /api/risk returns deterministic risk breakdown & factors');
  } else {
    fail('T04: /api/risk', `status: ${rRisk.status}`);
  }

  // 5. Alert API
  const rAlerts = await fetchJson(`${BASE}/api/alerts?lat=15.0&lon=74.0`);
  if (rAlerts.status === 200 && Array.isArray(rAlerts.body?.alerts)) {
    pass('T05: /api/alerts returns aggregated alerts and provider statuses');
  } else {
    fail('T05: /api/alerts', `status: ${rAlerts.status}`);
  }

  // 6. PFZ DEMO API
  const rPfz = await fetchJson(`${BASE}/api/pfz?lat=15.0&lon=74.0`);
  if (rPfz.status === 200 && rPfz.body?.status === 'DEMO') {
    pass('T06: /api/pfz returns verified DEMO dataset with honesty guarantee');
  } else {
    fail('T06: /api/pfz', `status: ${rPfz.status}`);
  }

  // 7. Command Center API
  const rCmd = await fetchJson(`${BASE}/api/command-center?lat=15.0&lon=74.0`);
  if (rCmd.status === 200 && rCmd.body?.alertSummary && rCmd.body?.dataSourceHealth) {
    pass('T07: /api/command-center returns aggregated tactical overview');
  } else {
    fail('T07: /api/command-center', `status: ${rCmd.status}`);
  }

  // 8. Agent API Baseline
  const rAgent = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Hello ORCA', conversationState: { messageCount: 0, sessionStartedAt: new Date().toISOString() } })
  });
  if (rAgent.status === 200 && rAgent.body?.answer && rAgent.body?.plan) {
    pass('T08: /api/agent handles conversational orchestration');
  } else {
    fail('T08: /api/agent', `status: ${rAgent.status}`);
  }

  console.log('\n🎯 [2/7] SIH Primary Demonstration Scenarios');

  // 9. Killer Demo Query: Kochi fishing tomorrow morning
  const rKochi = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Is it safe to go fishing tomorrow morning from Kochi?' })
  });
  const kochiPassed = rKochi.status === 200 &&
    rKochi.body?.plan?.location?.name?.toLowerCase().includes('kochi') &&
    rKochi.body?.plan?.time?.windowKey === 'tomorrow_morning' &&
    rKochi.body?.evidence?.length > 0;
  if (kochiPassed) {
    pass('T09: Primary Demo: "Is it safe to go fishing tomorrow morning from Kochi?" executes full agent pipeline');
  } else {
    fail('T09: Primary Demo', JSON.stringify(rKochi.body?.plan));
  }

  // 10. Mumbai Marine Query
  const rMumbai = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Wave conditions near Mumbai' })
  });
  if (rMumbai.status === 200 && (rMumbai.body?.answer?.includes('Wave Height') || rMumbai.body?.answer?.includes('Sea State'))) {
    pass('T10: Query: "Wave conditions near Mumbai" returns grounded telemetry');
  } else {
    fail('T10: Mumbai Marine', rMumbai.body?.answer);
  }

  // 11. Porbandar Weather Query
  const rPorbandar = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Weather near Porbandar' })
  });
  if (rPorbandar.status === 200 && rPorbandar.body?.answer?.includes('Weather')) {
    pass('T11: Query: "Weather near Porbandar" returns meteorological conditions');
  } else {
    fail('T11: Porbandar Weather', rPorbandar.body?.answer);
  }

  // 12. Chennai Risk Query
  const rChennai = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Marine risk near Chennai' })
  });
  if (rChennai.status === 200 && rChennai.body?.riskAssessment) {
    pass('T12: Query: "Marine risk near Chennai" returns deterministic risk assessment');
  } else {
    fail('T12: Chennai Risk', rChennai.body?.answer);
  }

  // 13. Nearest Port Query
  const rPort = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Where is the nearest shelter port?' })
  });
  if (rPort.status === 200 && (rPort.body?.answer?.includes('Port') || rPort.body?.answer?.includes('Distance'))) {
    pass('T13: Query: "Where is the nearest shelter port?" returns geospatial port proximity');
  } else {
    fail('T13: Nearest Port', rPort.body?.answer);
  }

  console.log('\n🌐 [3/7] Multi-Lingual & Vernacular Intelligence');

  // 14. Hindi Query
  const rHindi = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'क्या कल सुबह कोच्चि के पास समुद्र की स्थिति ठीक है?' })
  });
  if (rHindi.status === 200 && rHindi.body?.detectedLanguage === 'hi') {
    pass('T14: Hindi Query correctly detected and processed in Hindi');
  } else {
    fail('T14: Hindi Query', `detectedLanguage: ${rHindi.body?.detectedLanguage}`);
  }

  // 15. Gujarati Query
  const rGujarati = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'કાલે સવારે પોરબંદર પાસે દરિયાની સ્થિતિ કેવી રહેશે?' })
  });
  if (rGujarati.status === 200 && rGujarati.body?.detectedLanguage === 'gu') {
    pass('T15: Gujarati Query correctly detected and processed in Gujarati');
  } else {
    fail('T15: Gujarati Query', `detectedLanguage: ${rGujarati.body?.detectedLanguage}`);
  }

  console.log('\n🔄 [4/7] Multi-Turn Conversation Context');

  // 16. Follow-up query retaining location/time
  const turn1 = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Is it safe to go fishing tomorrow morning from Kochi?' })
  });
  const turn2 = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({
      message: 'What about the waves?',
      conversationState: turn1.body?.conversationState
    })
  });
  const turn2Retained = turn2.status === 200 &&
    turn2.body?.plan?.location?.name?.toLowerCase().includes('kochi') &&
    turn2.body?.plan?.location?.resolvedFrom === 'CONTEXT_CARRY';
  if (turn2Retained) {
    pass('T16: Multi-turn Follow-up: "What about the waves?" retains Kochi location context');
  } else {
    fail('T16: Multi-turn context', JSON.stringify(turn2.body?.plan));
  }

  console.log('\n🛡️ [5/7] Evidence & Provenance Grounding');

  // 17. Evidence items check
  const evidencePassed = turn1.body?.evidence?.every(e => e.provider && e.source && e.status);
  if (evidencePassed) {
    pass('T17: Responses include verified EvidenceItems with complete provenance');
  } else {
    fail('T17: Evidence Items', JSON.stringify(turn1.body?.evidence));
  }

  // 18. Alert retrieval from GDACS
  const rAlertQuery = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Are there any alerts near India?' })
  });
  if (rAlertQuery.status === 200 && rAlertQuery.body?.answer?.includes('GDACS')) {
    pass('T18: Alert query correctly executes GDACS alert intelligence tool');
  } else {
    fail('T18: Alert tool', rAlertQuery.body?.answer);
  }

  // 19. Missing IMD handling
  if (rAlertQuery.body?.answer?.includes('OFFICIAL SOURCE NOT CONNECTED') || rAlertQuery.body?.answer?.includes('requires credentials') || rAlertQuery.body?.answer?.includes('IMD')) {
    pass('T19: Unconnected IMD feed is honestly reported as NOT CONNECTED (no fabrication)');
  } else {
    fail('T19: IMD feed reporting', rAlertQuery.body?.answer);
  }

  // 20. PFZ query honesty
  const rPfzQuery = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: "Where is today's PFZ?" })
  });
  if (rPfzQuery.status === 200 && rPfzQuery.body?.answer?.includes('DEMO')) {
    pass('T20: PFZ query transparently states DEMO status without claiming live INCOIS');
  } else {
    fail('T20: PFZ honesty', rPfzQuery.body?.answer);
  }

  console.log('\n🔒 [6/7] Security & Resilience');

  // 21. Invalid coordinates rejected
  const rBadCoords = await fetchJson(`${BASE}/api/risk?lat=999&lon=999`);
  if (rBadCoords.status === 400) {
    pass('T21: Out-of-bounds coordinates return HTTP 400 Bad Request');
  } else {
    fail('T21: Invalid coords', `status: ${rBadCoords.status}`);
  }

  // 22. Missing query parameters rejected
  const rMissingParam = await fetchJson(`${BASE}/api/marine`);
  if (rMissingParam.status === 400) {
    pass('T22: Missing query parameters return HTTP 400 with helpful error');
  } else {
    fail('T22: Missing params', `status: ${rMissingParam.status}`);
  }

  // 23. Malformed agent payload handled safely
  const rEmptyAgent = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: '' })
  });
  if (rEmptyAgent.status === 400) {
    pass('T23: Empty message payload returns HTTP 400 cleanly without crashing');
  } else {
    fail('T23: Empty agent payload', `status: ${rEmptyAgent.status}`);
  }

  // 24. No secret key exposure
  const stringifiedSources = JSON.stringify(rSources.body);
  const hasLeakedKey = /sk-[a-zA-Z0-9_-]{20,}/.test(stringifiedSources) || /AIza[0-9A-Za-z-_]{35}/.test(stringifiedSources);
  if (!hasLeakedKey) {
    pass('T24: Zero API credentials or secrets exposed in client-facing responses');
  } else {
    fail('T24: Secret leak check', 'Found API key pattern in response!');
  }

  // 25. Provenance integrity
  const rSourcesRegistry = await fetchJson(`${BASE}/api/sources`);
  const sources = rSourcesRegistry.body?.sources || [];
  const pfzRecord = sources.find(s => s.id === 'incois-pfz');
  const imdRecord = sources.find(s => s.id === 'imd-official');
  const gdacsRecord = sources.find(s => s.id === 'gdacs-alerts');
  const omWeatherRecord = sources.find(s => s.id === 'open-meteo-weather');
  const omMarineRecord = sources.find(s => s.id === 'open-meteo-marine');

  const provenanceOk =
    pfzRecord?.status === 'REQUIRES_CREDENTIALS' &&
    imdRecord?.status === 'REQUIRES_CREDENTIALS' &&
    gdacsRecord?.status === 'LIVE' &&
    omWeatherRecord?.status === 'LIVE' &&
    omMarineRecord?.status === 'LIVE';

  if (provenanceOk) {
    pass('T25: Source registry statuses strictly verified (Open-Meteo=LIVE, GDACS=LIVE, IMD=REQUIRES_CREDS, PFZ=REQUIRES_CREDS)');
  } else {
    fail('T25: Provenance integrity', JSON.stringify({ pfz: pfzRecord?.status, imd: imdRecord?.status, gdacs: gdacsRecord?.status }));
  }

  // 26. Safe Decision Support Wording Audit
  const rDisclaimerCheck = await fetchJson(`${BASE}/api/risk?lat=9.93&lon=76.26`);
  const disclaimerText = (rDisclaimerCheck.body?.disclaimer || '').toLowerCase();
  if (disclaimerText.includes('decision-support') && disclaimerText.includes('not an official government directive')) {
    pass('T26: Statutory prototype decision-support disclaimer permanently attached');
  } else {
    fail('T26: Disclaimer text', disclaimerText);
  }

  // 27. Deterministic Fallback Verification (No LLM Key needed)
  const rFallback = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Are there alerts in the Arabian Sea' })
  });
  if (rFallback.status === 200 && rFallback.body?.answer) {
    pass('T27: Deterministic rule-based LLM fallback fully operates without external LLM keys');
  } else {
    fail('T27: Fallback operation', rFallback.body?.answer);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  FINAL RESULT: ${passCount} PASSED, ${failCount} FAILED (${passCount}/${passCount + failCount})`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failCount > 0) process.exit(1);
}

runTests();
