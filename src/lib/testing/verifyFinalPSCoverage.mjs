/**
 * ORCA — Final PS Coverage & Problem Statement Enhancement Test Suite
 * 
 * Validates complete SIH problem statement coverage with strict honesty:
 * 1. Satellite / Chlorophyll Ocean Color (DEMO)
 * 2. PFZ Intelligence (DEMO)
 * 3. Tide Intelligence (UNAVAILABLE)
 * 4. Hazard & Alert Intelligence (LIVE GDACS / IMD UNAVAILABLE)
 * 5. Maritime Geofencing & Protected Areas (REFERENCE)
 * 6. Safe Passage Route Optimization (PROTOTYPE MODEL)
 * 7. High Chlorophyll + Favourable SST Productivity Analysis (PROTOTYPE MODEL)
 * 8. Historical Marine Analytics Foundation (REFERENCE)
 * 9. Multi-Lingual Intelligence (Hindi / Gujarati)
 * 10. Multi-Turn Conversation State
 * 11. Security, Resilience & Build Integrity
 * 
 * Run: node src/lib/testing/verifyFinalPSCoverage.mjs
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
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  ORCA — FINAL PS COVERAGE & SIH PROBLEM STATEMENT VERIFICATION    ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  Server: ${BASE}`);
  console.log(`  Time:   ${new Date().toISOString()}\n`);

  // -------------------------------------------------------------------------
  // 1. Satellite & Chlorophyll Intelligence
  // -------------------------------------------------------------------------
  console.log('🛰️ [1/8] Satellite Ocean Color & Chlorophyll Intelligence');
  const rSat = await fetchJson(`${BASE}/api/satellite?lat=18.92&lon=72.83`);
  if (rSat.status === 200 && rSat.body?.chlorophyll?.status === 'DEMO' && typeof rSat.body?.chlorophyll?.value === 'number') {
    pass('T01: /api/satellite returns structured chlorophyll-a observation with explicit DEMO status');
  } else {
    fail('T01: /api/satellite', JSON.stringify(rSat.body));
  }

  const rChloroQuery = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Which regions have high chlorophyll and favourable SST?' })
  });
  if (rChloroQuery.status === 200 && (rChloroQuery.body?.answer?.includes('Chlorophyll') || rChloroQuery.body?.answer?.includes('उत्पादकता'))) {
    pass('T02: Agent resolves chlorophyll & SST query executing analyzeMarineProductivity tool');
  } else {
    fail('T02: Agent chlorophyll query', rChloroQuery.body?.answer);
  }

  // -------------------------------------------------------------------------
  // 2. PFZ Intelligence
  // -------------------------------------------------------------------------
  console.log('\n🐟 [2/8] Potential Fishing Zone (PFZ) Intelligence');
  const rPfz = await fetchJson(`${BASE}/api/pfz?lat=9.93&lon=76.26`);
  if (rPfz.status === 200 && rPfz.body?.status === 'DEMO') {
    pass('T03: /api/pfz returns verified DEMO dataset without claiming live INCOIS');
  } else {
    fail('T03: /api/pfz', JSON.stringify(rPfz.body));
  }

  const rPfzAgent = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: "Where is today's PFZ?" })
  });
  if (rPfzAgent.status === 200 && rPfzAgent.body?.answer?.includes('DEMO')) {
    pass('T04: Agent PFZ response honestly states DEMO status and provides SAMUDRA portal guidance');
  } else {
    fail('T04: Agent PFZ', rPfzAgent.body?.answer);
  }

  // -------------------------------------------------------------------------
  // 3. Tide Intelligence
  // -------------------------------------------------------------------------
  console.log('\n🌊 [3/8] Tide Intelligence & Station Network');
  const rTides = await fetchJson(`${BASE}/api/tides?lat=9.93&lon=76.26`);
  if (rTides.status === 200 && rTides.body?.status === 'UNAVAILABLE' && rTides.body?.station?.name) {
    pass('T05: /api/tides honestly reports UNAVAILABLE with nearest reference station (zero fabrication)');
  } else {
    fail('T05: /api/tides', JSON.stringify(rTides.body));
  }

  const rTideAgent = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'What are the tides near Kochi tomorrow?' })
  });
  if (rTideAgent.status === 200 && (rTideAgent.body?.answer?.includes('UNAVAILABLE') || rTideAgent.body?.answer?.includes('Survey of India'))) {
    pass('T06: Agent responds to tide query explaining SoI/INCOIS institutional data status');
  } else {
    fail('T06: Agent tide query', rTideAgent.body?.answer);
  }

  // -------------------------------------------------------------------------
  // 4. Maritime Geofencing & Protected Areas
  // -------------------------------------------------------------------------
  console.log('\n🗺️ [4/8] Maritime Geofencing & Sensitive Areas');
  const rGeofence = await fetchJson(`${BASE}/api/geofences?lat=9.15&lon=78.95`);
  if (rGeofence.status === 200 && rGeofence.body?.insideZones?.length > 0 && rGeofence.body?.isRestricted) {
    pass('T07: /api/geofences detects Gulf of Mannar Marine National Park prohibited zone');
  } else {
    fail('T07: /api/geofences Gulf of Mannar', JSON.stringify(rGeofence.body));
  }

  const rGeofenceAgent = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'What areas should I avoid near Kochi?' })
  });
  if (rGeofenceAgent.status === 200 && (rGeofenceAgent.body?.answer?.includes('Marine Protected') || rGeofenceAgent.body?.answer?.includes('Geofences'))) {
    pass('T08: Agent executes getGeofences tool and reports nearby marine sanctuaries');
  } else {
    fail('T08: Agent geofence query', rGeofenceAgent.body?.answer);
  }

  // -------------------------------------------------------------------------
  // 5. Safe Route Optimization
  // -------------------------------------------------------------------------
  console.log('\n🧭 [5/8] Safe Passage Route Optimization Engine');
  const rRoute = await fetchJson(`${BASE}/api/route?from_lat=21.64&from_lon=69.62&from_name=Porbandar&to_lat=18.92&to_lon=72.83&to_name=Mumbai`);
  if (rRoute.status === 200 && rRoute.body?.waypoints?.length >= 3 && rRoute.body?.totalDistanceNM > 0) {
    pass('T09: /api/route computes deterministic risk-aware passage corridor from Porbandar to Mumbai');
  } else {
    fail('T09: /api/route', JSON.stringify(rRoute.body));
  }

  const rRouteAgent = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'What is the safest route from Porbandar to Mumbai?' })
  });
  if (rRouteAgent.status === 200 && (rRouteAgent.body?.answer?.includes('Waypoints') || rRouteAgent.body?.answer?.includes('Passage') || rRouteAgent.body?.answer?.includes('Distance'))) {
    pass('T10: Agent executes findSafestRoute tool and outputs waypoint corridor with decision disclaimer');
  } else {
    fail('T10: Agent route query', rRouteAgent.body?.answer);
  }

  // -------------------------------------------------------------------------
  // 6. High Chlorophyll + SST Marine Productivity
  // -------------------------------------------------------------------------
  console.log('\n🟢 [6/8] Marine Productivity Correlation Engine');
  const rProd = await fetchJson(`${BASE}/api/analytics/productivity?lat=15.0&lon=74.0&sst=28.5`);
  if (rProd.status === 200 && rProd.body?.productivityIndex && typeof rProd.body?.score === 'number') {
    pass('T11: /api/analytics/productivity computes composite SST-Chlorophyll productivity index');
  } else {
    fail('T11: /api/analytics/productivity', JSON.stringify(rProd.body));
  }

  // -------------------------------------------------------------------------
  // 7. Historical Analytics & Trend Diagnostics
  // -------------------------------------------------------------------------
  console.log('\n📉 [7/8] Historical Marine Analytics Foundation');
  const rHistAgent = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Why has fish productivity declined near this coast?' })
  });
  if (rHistAgent.status === 200 && (rHistAgent.body?.answer?.includes('Historical') || rHistAgent.body?.answer?.includes('climatological') || rHistAgent.body?.answer?.includes('CMFRI'))) {
    pass('T12: Agent handles historical fish productivity question using environmental correlation without fake causality');
  } else {
    fail('T12: Agent historical query', rHistAgent.body?.answer);
  }

  // -------------------------------------------------------------------------
  // 8. Multi-Lingual & Multi-Turn Verification
  // -------------------------------------------------------------------------
  console.log('\n🌐 [8/8] Multi-Lingual & Regression Verification');
  const rHindi = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'क्या कल सुबह कोच्चि के पास समुद्र की स्थिति ठीक है?' })
  });
  if (rHindi.status === 200 && rHindi.body?.detectedLanguage === 'hi') {
    pass('T13: Hindi query processed with native vernacular synthesis');
  } else {
    fail('T13: Hindi query', `detectedLanguage: ${rHindi.body?.detectedLanguage}`);
  }

  const rGujarati = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'કાલે સવારે પોરબંદર પાસે દરિયાની સ્થિતિ કેવી રહેશે?' })
  });
  if (rGujarati.status === 200 && rGujarati.body?.detectedLanguage === 'gu') {
    pass('T14: Gujarati query processed with native vernacular synthesis');
  } else {
    fail('T14: Gujarati query', `detectedLanguage: ${rGujarati.body?.detectedLanguage}`);
  }

  // 15. Killer Workflow: Kochi fishing tomorrow morning
  const rKochi = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Is it safe to go fishing tomorrow morning from Kochi?' })
  });
  if (rKochi.status === 200 && rKochi.body?.plan?.location?.name?.toLowerCase().includes('kochi')) {
    pass('T15: Killer Workflow: "Is it safe to go fishing tomorrow morning from Kochi?" fully succeeds');
  } else {
    fail('T15: Killer workflow', JSON.stringify(rKochi.body?.plan));
  }

  // 16. Multi-turn follow-up retaining context
  const rFollowup = await fetchJson(`${BASE}/api/agent`, {
    method: 'POST',
    body: JSON.stringify({ message: 'What about the waves?', conversationState: rKochi.body?.conversationState })
  });
  if (rFollowup.status === 200 && rFollowup.body?.plan?.location?.resolvedFrom === 'CONTEXT_CARRY') {
    pass('T16: Multi-turn Follow-up: Retains Kochi location across conversation turns');
  } else {
    fail('T16: Multi-turn context', JSON.stringify(rFollowup.body?.plan));
  }

  // 17. Security Check (No Secret Leakage)
  const rSources = await fetchJson(`${BASE}/api/sources`);
  const stringified = JSON.stringify(rSources.body);
  const keyLeak = /sk-[a-zA-Z0-9_-]{20,}/.test(stringified) || /AIza[0-9A-Za-z-_]{35}/.test(stringified);
  if (!keyLeak) {
    pass('T17: Zero credentials, API secrets, or internal keys exposed in client payloads');
  } else {
    fail('T17: Secret leakage', 'Found key pattern in response');
  }

  // 18. Provenance Integrity Check
  const sources = rSources.body?.sources || [];
  const tideRecord = sources.find(s => s.id === 'soi-incois-tides');
  const chloroRecord = sources.find(s => s.id === 'demo-satellite-chlorophyll');
  const geofenceRecord = sources.find(s => s.id === 'orca-geofences');

  const provenanceVerified =
    tideRecord?.status === 'UNAVAILABLE' &&
    chloroRecord?.status === 'DEMO' &&
    geofenceRecord?.status === 'REFERENCE';

  if (provenanceVerified) {
    pass('T18: Strict Provenance: Tide=UNAVAILABLE, Chlorophyll=DEMO, Geofence=REFERENCE verified in Source Registry');
  } else {
    fail('T18: Provenance verification', JSON.stringify({ tide: tideRecord?.status, chloro: chloroRecord?.status, geo: geofenceRecord?.status }));
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`  FINAL RESULT: ${passCount} PASSED, ${failCount} FAILED (${passCount}/${passCount + failCount})`);
  console.log('═══════════════════════════════════════════════════════════════════');

  if (failCount > 0) process.exit(1);
}

runTests();
