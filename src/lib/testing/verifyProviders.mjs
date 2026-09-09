/**
 * ORCA Milestone 2 Pipeline Verification Suite
 * Tests all 8 criteria specified for live provider validation.
 */

async function runTestSuite() {
  console.log('====================================================');
  console.log('🌊 ORCA MILESTONE 2: LIVE DATA PIPELINE VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 8;

  const BASE_URL = 'http://localhost:3000';

  // Test 1: Valid Coastal Coordinates (Mumbai)
  console.log('TEST 1: Valid Coastal Coordinates (Mumbai: 18.9220°N, 72.8347°E)');
  try {
    const resMarine = await fetch(`${BASE_URL}/api/marine?lat=18.9220&lon=72.8347`);
    const marineData = await resMarine.json();
    const resWeather = await fetch(`${BASE_URL}/api/weather?lat=18.9220&lon=72.8347`);
    const weatherData = await resWeather.json();

    if (
      resMarine.status === 200 &&
      resWeather.status === 200 &&
      marineData.status === 'LIVE' &&
      weatherData.status === 'LIVE' &&
      typeof marineData.waveHeight.value === 'number' &&
      typeof weatherData.windSpeed.value === 'number'
    ) {
      console.log('  ✅ PASSED: Live Wave Height =', marineData.waveHeight.value, 'm, Wind Speed =', weatherData.windSpeed.value, 'km/h');
      console.log('     Source:', marineData.source);
      console.log('     Retrieved At:', marineData.retrievedAt);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Unexpected response format', { marineData, weatherData });
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // Test 2: Invalid Latitude (> 90)
  console.log('\nTEST 2: Invalid Latitude (Lat: 195.0, Lon: 72.83)');
  try {
    const res = await fetch(`${BASE_URL}/api/weather?lat=195.0&lon=72.83`);
    const data = await res.json();
    if (res.status === 400 && data.error) {
      console.log('  ✅ PASSED: Correctly returned HTTP 400 Bad Request:', data.error);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Expected HTTP 400, got:', res.status, data);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // Test 3: Invalid Longitude (> 180)
  console.log('\nTEST 3: Invalid Longitude (Lat: 18.92, Lon: 280.0)');
  try {
    const res = await fetch(`${BASE_URL}/api/marine?lat=18.92&lon=280.0`);
    const data = await res.json();
    if (res.status === 400 && data.error) {
      console.log('  ✅ PASSED: Correctly returned HTTP 400 Bad Request:', data.error);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Expected HTTP 400, got:', res.status, data);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // Test 4: Missing Required Query Parameters
  console.log('\nTEST 4: Missing Required Query Parameters (No lat/lon)');
  try {
    const res = await fetch(`${BASE_URL}/api/marine`);
    const data = await res.json();
    if (res.status === 400 && data.error) {
      console.log('  ✅ PASSED: Correctly returned HTTP 400 with usage instructions:', data.error);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Expected HTTP 400, got:', res.status, data);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // Test 5: Landlocked Coordinates (New Delhi: 28.6139°N, 77.2090°E - No Ocean Data)
  console.log('\nTEST 5: Landlocked / Terrestrial Coordinates (New Delhi)');
  try {
    const res = await fetch(`${BASE_URL}/api/marine?lat=28.6139&lon=77.2090`);
    const marineData = await res.json();
    if (
      res.status === 200 &&
      marineData.status === 'UNAVAILABLE' &&
      marineData.waveHeight.value === null &&
      marineData.errorState?.code === 'LANDLOCKED_COORDINATES'
    ) {
      console.log('  ✅ PASSED: Correctly returned UNAVAILABLE for inland point:', marineData.errorState.message);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Expected UNAVAILABLE with null wave values, got:', marineData);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // Test 6: Specific Target Time Query ("Tomorrow Morning" ~06:00 AM UTC)
  console.log('\nTEST 6: Specific Forecast Target Time Window (Tomorrow 06:00 UTC)');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(6, 0, 0, 0);
    const timeIso = tomorrow.toISOString();

    const res = await fetch(`${BASE_URL}/api/marine?lat=13.0827&lon=80.2707&time=${encodeURIComponent(timeIso)}`);
    const marineData = await res.json();
    if (
      res.status === 200 &&
      marineData.status === 'LIVE' &&
      marineData.hourlyForecast &&
      marineData.hourlyForecast.length > 24
    ) {
      console.log('  ✅ PASSED: Successfully retrieved forecast for target time:', marineData.timestamp);
      console.log('     Tomorrow 06:00 UTC Wave Height =', marineData.waveHeight.value, 'm, Swell =', marineData.swellWaveHeight.value, 'm');
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Expected target time forecast, got:', marineData);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // Test 7: Correct LIVE Status Tagging & Field Completeness
  console.log('\nTEST 7: Correct LIVE Status Tagging & Metric Completeness (Kochi Coast)');
  try {
    const res = await fetch(`${BASE_URL}/api/weather?lat=9.9312&lon=76.2673`);
    const weatherData = await res.json();
    const metrics = [
      weatherData.windSpeed,
      weatherData.windGusts,
      weatherData.windDirection,
      weatherData.surfacePressure,
      weatherData.precipitation,
    ];

    const allMetricsLive = metrics.every((m) => m.status === 'LIVE' && typeof m.value === 'number' && m.source && m.timestamp);

    if (allMetricsLive) {
      console.log('  ✅ PASSED: All 5 weather metrics have LIVE status, source attribution, and timestamps.');
      console.log('     Pressure =', weatherData.surfacePressure.value, 'hPa, Condition =', weatherData.weatherDescription);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: Some metrics failed LIVE verification:', metrics);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  // Test 8: Ocean Currents & SST Live Attributes
  console.log('\nTEST 8: Ocean Currents & Sea Surface Temperature Verification (Chennai Coast)');
  try {
    const res = await fetch(`${BASE_URL}/api/marine?lat=13.0827&lon=80.2707`);
    const marineData = await res.json();

    if (
      marineData.status === 'LIVE' &&
      typeof marineData.seaSurfaceTemperature.value === 'number' &&
      typeof marineData.oceanCurrentVelocity.value === 'number'
    ) {
      console.log('  ✅ PASSED: Live SST =', marineData.seaSurfaceTemperature.value, '°C, Current Velocity =', marineData.oceanCurrentVelocity.value, 'm/s');
      console.log('     Disclaimer included:', !!marineData.disclaimer);
      passedTests++;
    } else {
      console.log('  ❌ FAILED: SST or Ocean current velocity missing:', marineData);
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');
}

runTestSuite();
