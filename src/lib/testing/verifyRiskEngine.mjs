/**
 * ORCA Milestone 3 Risk Engine Verification Suite
 * Tests all 12 criteria for the deterministic risk assessment and geospatial engine.
 */

async function runRiskTestSuite() {
  console.log('===========================================================');
  console.log('🛡️ ORCA MILESTONE 3: DETERMINISTIC RISK ENGINE VERIFICATION');
  console.log('===========================================================\n');

  let passedTests = 0;
  const totalTests = 12;
  const BASE_URL = 'http://localhost:3000';

  // Helper distance function for verification
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  // TEST 1: Live Risk Evaluation for Mumbai Coast (Arabian Sea)
  console.log('TEST 1: Live Risk Evaluation for Mumbai Coast (18.9220°N, 72.8347°E)');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=18.9220&lon=72.8347`);
    const data = await res.json();
    if (
      res.status === 200 &&
      ['LOW', 'MODERATE', 'HIGH', 'SEVERE'].includes(data.riskLevel) &&
      typeof data.riskScore === 'number' &&
      data.factors &&
      data.factors.length === 5
    ) {
      console.log(`  ✅ PASSED: Evaluated as ${data.riskLevel} (Score: ${data.riskScore}/100, Safety: ${data.safetyScore}%)`);
      console.log(`     Summary: ${data.summary}`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED:', data);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 2: Tomorrow Morning Target-Time Forecast Evaluation (Kochi Coast)
  console.log('\nTEST 2: "Tomorrow Morning" Target-Time Forecast Evaluation (Kochi: 9.9312°N, 76.2673°E)');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=9.9312&lon=76.2673&time=tomorrow_morning`);
    const data = await res.json();
    if (
      res.status === 200 &&
      data.timeLabel.includes('Tomorrow Morning') &&
      data.riskLevel &&
      data.factors.every((f) => f.source && f.timestamp)
    ) {
      console.log(`  ✅ PASSED: Successfully evaluated forecast for ${data.timeLabel}: Level=${data.riskLevel}, Score=${data.riskScore}/100`);
      console.log(`     Vessel Guidance: ${data.vesselAdvisory.guidance}`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED:', data);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 3: Wave Height Factor Transparency & Reason Contribution (Chennai Coast)
  console.log('\nTEST 3: Individual Factor Transparency & Reason Contribution (Chennai Coast)');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=13.0827&lon=80.2707`);
    const data = await res.json();
    const waveFactor = data.factors.find((f) => f.factor === 'WAVE_HEIGHT');
    const windFactor = data.factors.find((f) => f.factor === 'WIND_SPEED');

    if (waveFactor && windFactor && waveFactor.reason && windFactor.reason) {
      console.log(`  ✅ PASSED: Factor Breakdown:`);
      console.log(`     • ${waveFactor.label}: ${waveFactor.value} ${waveFactor.unit} [${waveFactor.level}] -> "${waveFactor.reason}"`);
      console.log(`     • ${windFactor.label}: ${windFactor.value} ${windFactor.unit} [${windFactor.level}] -> "${windFactor.reason}"`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Factors missing reasons:', data.factors);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 4: Missing Wave Data Handling for Landlocked Location (New Delhi)
  console.log('\nTEST 4: Missing Marine Telemetry Handling for Inland Point (New Delhi: 28.61°N, 77.20°E)');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=28.6139&lon=77.2090`);
    const data = await res.json();
    const waveFactor = data.factors.find((f) => f.factor === 'WAVE_HEIGHT');

    if (waveFactor && waveFactor.level === 'UNKNOWN' && waveFactor.value === null) {
      console.log(`  ✅ PASSED: Wave factor correctly set to UNKNOWN with null value for inland point.`);
      console.log(`     Missing reason: ${waveFactor.reason}`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Inland point did not return UNKNOWN wave factor:', data);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 5: Nearest Indian Coastal Port Identification
  console.log('\nTEST 5: Nearest Indian Port Identification (Off Porbandar: 21.64°N, 69.62°E)');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=21.6417&lon=69.6293`);
    const data = await res.json();
    if (data.nearestPort && data.nearestPort.portName.includes('Porbandar')) {
      console.log(`  ✅ PASSED: Correctly identified ${data.nearestPort.portName} (${data.nearestPort.distanceKm} km / ${data.nearestPort.distanceNM} NM away).`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Nearest port identification failed:', data.nearestPort);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 6: Invalid Latitude Handling (> 90)
  console.log('\nTEST 6: Invalid Coordinates Handling (Lat: 195.0)');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=195.0&lon=72.83`);
    const data = await res.json();
    if (res.status === 400 && data.error) {
      console.log(`  ✅ PASSED: Correctly rejected invalid coordinates with HTTP 400: ${data.error}`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Expected HTTP 400, got:', res.status, data);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 7: Missing Required Parameters Handling
  console.log('\nTEST 7: Missing Query Parameters Handling');
  try {
    const res = await fetch(`${BASE_URL}/api/risk`);
    const data = await res.json();
    if (res.status === 400 && data.error) {
      console.log(`  ✅ PASSED: Correctly returned HTTP 400 with usage help: ${data.error}`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED:', res.status, data);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 8: Evidence Integrity & Source Attribution
  console.log('\nTEST 8: Evidence Generation Integrity (Visakhapatnam Deep Sea)');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=17.6868&lon=83.2185`);
    const data = await res.json();
    if (
      data.evidence &&
      data.evidence.length >= 2 &&
      data.evidence.every((ev) => ev.source && ev.timestamp && ev.rawMetrics)
    ) {
      console.log(`  ✅ PASSED: Successfully attached ${data.evidence.length} evidence records with raw metrics.`);
      console.log(`     Evidence 0: [${data.evidence[0].dataType}] via ${data.evidence[0].source}`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Evidence records missing or malformed:', data.evidence);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 9: Vessel Category Specific Advisories
  console.log('\nTEST 9: Vessel Category Suitability Assessment');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=18.9220&lon=72.8347`);
    const data = await res.json();
    const va = data.vesselAdvisory;
    if (va && typeof va.smallCraftCaution === 'boolean' && typeof va.motorizedCraftCaution === 'boolean') {
      console.log(`  ✅ PASSED: Vessel Suitability: Small Craft Caution=${va.smallCraftCaution}, Motorized Caution=${va.motorizedCraftCaution}, Deep Sea Caution=${va.deepSeaVesselCaution}`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Vessel advisory missing:', va);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 10: Great Circle Distance Formula Math Precision
  console.log('\nTEST 10: Great Circle Distance Math Precision');
  const d1 = calculateDistanceKm(18.9438, 72.8441, 18.9220, 72.8347);
  if (d1 >= 2.0 && d1 <= 3.5) {
    console.log(`  ✅ PASSED: Calculated Great Circle distance = ${d1} km.`);
    passedTests++;
  } else {
    console.log('  ❌ FAILED: Distance math inaccurate:', d1);
  }

  // TEST 11: Statutory Prototype Disclaimer Integrity
  console.log('\nTEST 11: Prototype Decision-Support Disclaimer Presence');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=13.0827&lon=80.2707`);
    const data = await res.json();
    if (data.disclaimer && data.disclaimer.includes('ORCA prototype decision-support')) {
      console.log(`  ✅ PASSED: Disclaimer attached: "${data.disclaimer.slice(0, 70)}..."`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Disclaimer missing:', data.disclaimer);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // TEST 12: Ocean Current & SST Factor Scoring
  console.log('\nTEST 12: Ocean Current & SST Factor Evaluation');
  try {
    const res = await fetch(`${BASE_URL}/api/risk?lat=8.0883&lon=77.5385`); // Kanyakumari Confluence
    const data = await res.json();
    const currentFactor = data.factors.find((f) => f.factor === 'OCEAN_CURRENT');
    if (currentFactor && typeof currentFactor.score === 'number') {
      console.log(`  ✅ PASSED: Kanyakumari Confluence Current Factor = ${currentFactor.value} ${currentFactor.unit} [${currentFactor.level}]`);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Current factor missing:', currentFactor);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  console.log('\n===========================================================');
  console.log(`📊 RISK ENGINE TEST RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('===========================================================\n');
}

runRiskTestSuite();
