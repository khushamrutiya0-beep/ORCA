import { optimizeSafestRoute, doesSegmentCrossLand } from '../src/lib/routing/routeOptimizer.ts';

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  ORCA — SEA-ONLY MARINE SAFE ROUTING ENGINE VERIFICATION        ');
console.log('═══════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? '— ' + details : ''}`);
    failCount++;
  }
}

// Test 1: Mumbai to Chennai (West Coast to East Coast around Cape Comorin)
console.log('🚢 [1/4] Inter-Coastal Route: Mumbai (West) -> Chennai (East)');
const mumbaiToChennai = optimizeSafestRoute({
  origin: { name: 'Mumbai Port', latitude: 18.9220, longitude: 72.8347 },
  destination: { name: 'Chennai Port', latitude: 13.0850, longitude: 80.2950 },
});

assert(mumbaiToChennai.isSeaRouteValid === true, 'T01: Route marked valid');
assert(mumbaiToChennai.waypoints.length >= 4, 'T01: Multi-waypoint passage corridor generated');
assert(mumbaiToChennai.passageType === 'INTER_COASTAL_ROUND_CAPES', 'T01: Identified inter-coastal passage');
// Check that route reaches south of Cape Comorin (latitude < 8.2°N)
const minLat = Math.min(...mumbaiToChennai.waypoints.map(w => w.latitude));
assert(minLat <= 8.2, `T01: Corridor navigates south of Cape Comorin (minLat: ${minLat}°N <= 8.2°N)`);

// Check every segment of the route
let segmentCrossesLand = false;
for (let i = 0; i < mumbaiToChennai.waypoints.length - 1; i++) {
  const p1 = [mumbaiToChennai.waypoints[i].latitude, mumbaiToChennai.waypoints[i].longitude];
  const p2 = [mumbaiToChennai.waypoints[i+1].latitude, mumbaiToChennai.waypoints[i+1].longitude];
  if (doesSegmentCrossLand(p1, p2)) {
    segmentCrossesLand = true;
    console.error(`  Segment crossed land: [${p1}] -> [${p2}]`);
  }
}
assert(!segmentCrossesLand, 'T01: Zero overland segments detected in Mumbai -> Chennai route');

// Test 2: Porbandar to Mumbai (Rounding Kathiawar Peninsula)
console.log('\n🚢 [2/4] Peninsular Bypass Route: Porbandar (Gujarat) -> Mumbai (Maharashtra)');
const porbandarToMumbai = optimizeSafestRoute({
  origin: { name: 'Porbandar Port', latitude: 21.6417, longitude: 69.6293 },
  destination: { name: 'Mumbai Port', latitude: 18.9220, longitude: 72.8347 },
});

assert(porbandarToMumbai.isSeaRouteValid === true, 'T02: Route marked valid');
let pToMCrossesLand = false;
for (let i = 0; i < porbandarToMumbai.waypoints.length - 1; i++) {
  const p1 = [porbandarToMumbai.waypoints[i].latitude, porbandarToMumbai.waypoints[i].longitude];
  const p2 = [porbandarToMumbai.waypoints[i+1].latitude, porbandarToMumbai.waypoints[i+1].longitude];
  if (doesSegmentCrossLand(p1, p2)) {
    pToMCrossesLand = true;
  }
}
assert(!pToMCrossesLand, 'T02: Zero overland segments detected in Porbandar -> Mumbai route');

// Test 3: Kochi to Visakhapatnam
console.log('\n🚢 [3/4] Trans-Oceanic Coastal Route: Kochi -> Visakhapatnam');
const kochiToVizag = optimizeSafestRoute({
  origin: { name: 'Kochi Port', latitude: 9.9600, longitude: 76.2700 },
  destination: { name: 'Visakhapatnam Port', latitude: 17.6900, longitude: 83.3000 },
});
assert(kochiToVizag.isSeaRouteValid === true, 'T03: Route marked valid');
assert(kochiToVizag.totalDistanceNM > 800, `T03: Nautical distance is realistic (${kochiToVizag.totalDistanceNM} NM > 800 NM)`);

// Test 4: Direct Coastal Route: Kochi -> Mormugao (Goa)
console.log('\n🚢 [4/4] Direct Coastal Route: Kochi -> Mormugao (Goa)');
const kochiToGoa = optimizeSafestRoute({
  origin: { name: 'Kochi Port', latitude: 9.9600, longitude: 76.2700 },
  destination: { name: 'Mormugao Port', latitude: 15.4100, longitude: 73.8000 },
});
assert(kochiToGoa.isSeaRouteValid === true, 'T04: Route marked valid');
assert(kochiToGoa.totalDistanceNM > 0, `T04: Distance computed (${kochiToGoa.totalDistanceNM} NM)`);

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log(`  RESULT: ${passCount} PASSED, ${failCount} FAILED (${passCount}/${passCount + failCount})`);
console.log('═══════════════════════════════════════════════════════════════════\n');

if (failCount > 0) process.exit(1);
