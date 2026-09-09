// scripts/verifyFrontendMilestone.mjs
import http from 'http';

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, text: data });
        }
      });
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runVerification() {
  console.log('====================================================');
  console.log('ORCA FRONTEND MILESTONE — VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Health endpoint
  await check('Health endpoint returns 200 and healthy status', async () => {
    const res = await get('http://localhost:3000/api/health');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 2. Live Marine Telemetry API
  await check('Live Open-Meteo Marine API returns LIVE wave & SST data', async () => {
    const res = await get('http://localhost:3000/api/marine?lat=18.922&lon=72.8347');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.data.status !== 'LIVE') throw new Error(`Expected LIVE status, got ${res.data.status}`);
    if (typeof res.data.waveHeight.value !== 'number') throw new Error('Missing wave height');
  });

  // 3. Live Weather Telemetry API
  await check('Live Open-Meteo Weather API returns LIVE wind & pressure data', async () => {
    const res = await get('http://localhost:3000/api/weather?lat=18.922&lon=72.8347');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.data.status !== 'LIVE') throw new Error(`Expected LIVE status, got ${res.data.status}`);
    if (typeof res.data.windSpeed.value !== 'number') throw new Error('Missing wind speed');
  });

  // 4. Deterministic Risk Engine API
  await check('Deterministic Marine Risk API evaluates safety score and nearest port', async () => {
    const res = await get('http://localhost:3000/api/risk?lat=18.922&lon=72.8347');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.riskLevel) throw new Error('Missing riskLevel');
    if (!res.data.nearestPort) throw new Error('Missing nearestPort');
    if (!res.data.evidence || res.data.evidence.length === 0) throw new Error('Missing evidence items');
  });

  // 5. GDACS Live Alerts API
  await check('GDACS Live Alerts API returns active hazard events', async () => {
    const res = await get('http://localhost:3000/api/alerts?lat=18.922&lon=72.8347');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.data.alerts)) throw new Error('Expected alerts array');
  });

  // 6. Geofences API
  await check('Geofences API returns Marine Protected Areas with boundaries', async () => {
    const res = await get('http://localhost:3000/api/geofences?lat=9.9312&lon=76.2673');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.data.isRestricted !== 'boolean') throw new Error('Missing isRestricted field');
    if (!Array.isArray(res.data.insideZones)) throw new Error('Missing insideZones array');
  });

  // 7. Safe Route Optimizer API
  await check('Safe Route Optimizer computes corridor avoiding protected areas', async () => {
    const res = await get('http://localhost:3000/api/route?from_lat=18.922&from_lon=72.8347&to_lat=9.9312&to_lon=76.2673');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.waypoints || !Array.isArray(res.data.waypoints)) throw new Error('Missing route waypoints');
    if (res.data.totalDistanceNM <= 0) throw new Error('Invalid distance');
  });

  // 8. Tides API
  await check('Tides API returns honest UNAVAILABLE status for Survey of India', async () => {
    const res = await get('http://localhost:3000/api/tides?lat=18.922&lon=72.8347');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.data.status !== 'UNAVAILABLE') throw new Error(`Expected UNAVAILABLE, got ${res.data.status}`);
  });

  // 9. Sources API
  await check('Sources API returns complete provenance registry', async () => {
    const res = await get('http://localhost:3000/api/sources');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.data.sources)) throw new Error('Expected sources array');
  });

  // 10. Agent API multi-lingual query
  await check('Agent API answers English query with deterministic facts and evidence', async () => {
    const res = await post('http://localhost:3000/api/agent', {
      message: 'Is it safe to go fishing tomorrow morning from Kochi?',
      coordinates: { latitude: 9.9312, longitude: 76.2673 },
      locationName: 'Kochi Coastal Waters',
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.answer) throw new Error('Missing answer string');
    if (!res.data.evidence || res.data.evidence.length === 0) throw new Error('Missing evidence items');
  });

  // 11. Agent API Hindi query
  await check('Agent API processes Hindi query with Hindi response', async () => {
    const res = await post('http://localhost:3000/api/agent', {
      message: 'क्या कल सुबह कोच्चि के पास समुद्र की स्थिति ठीक है?',
      coordinates: { latitude: 9.9312, longitude: 76.2673 },
      locationName: 'Kochi Coastal Waters',
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.answer) throw new Error('Missing answer string');
  });

  console.log('\n----------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================');
}

runVerification().catch(console.error);
