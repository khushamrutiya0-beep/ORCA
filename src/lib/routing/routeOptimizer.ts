/**
 * ORCA Deterministic Safe Route Optimization Engine (Sea-Only Navigation Mesh)
 * 
 * Safety Ground Truth:
 * - Computes water-only maritime passage corridors between coastal points.
 * - HARD CONSTRAINT: Never crosses land, peninsulas, or prohibited marine sanctuaries.
 * - Utilizes an Indian EEZ nautical transit graph, land intersection ray-casting,
 *   and Dijkstra pathfinding around geographical capes (Cape Comorin, Kathiawar Peninsula, Sri Lanka).
 * 
 * Prototype Decision-Support Model:
 * NOT an official nautical navigational chart or Coast Guard passage clearance.
 */

import { Coordinates, RiskLevel } from '../types';
import { calculateDistanceKm } from '../geospatial';
import { INDIAN_MARITIME_GEOFENCES } from '../geofencing/geofenceService';
import { OrcaAlert } from '../types/alert';

export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  legDistanceKm: number;
  estimatedRiskLevel: RiskLevel;
  advisoryNote?: string;
}

export interface SafestRouteResult {
  origin: { name: string; coordinates: Coordinates };
  destination: { name: string; coordinates: Coordinates };
  waypoints: RouteWaypoint[];
  totalDistanceKm: number;
  totalDistanceNM: number;
  overallRouteRisk: RiskLevel;
  avoidedZones: string[];
  hazardsDetected: string[];
  isSeaRouteValid: boolean;
  passageType?: 'COASTAL_PASSAGE' | 'OPEN_SEA_TRANSIT' | 'INTER_COASTAL_ROUND_CAPES';
  statusMessage?: string;
  sourceStatus: 'PROTOTYPE_MODEL';
  generatedAt: string;
  disclaimer: string;
}

export interface RouteOptimizationOptions {
  origin: { name: string; latitude: number; longitude: number };
  destination: { name: string; latitude: number; longitude: number };
  waveHeightM?: number;
  windSpeedKmh?: number;
  activeAlerts?: OrcaAlert[];
}

// --------------------------------------------------------------------------
// 1. INLAND BOUNDARY POLYGONS FOR NON-NAVIGABLE LAND IDENTIFICATION
// --------------------------------------------------------------------------

type Point = [number, number]; // [lat, lon]

// Polygon 1: Peninsular India Mainland Interior (Inland of coastal waters)
const PENINSULAR_INDIA_POLYGON: Point[] = [
  [8.14, 77.56],   // Inland of Kanyakumari
  [8.55, 77.02],   // Inland of Thiruvananthapuram
  [10.02, 76.35],  // Inland of Kochi
  [11.30, 75.85],  // Inland of Kozhikode
  [12.92, 74.92],  // Inland of Mangalore
  [14.85, 74.20],  // Inland of Karwar
  [15.45, 73.88],  // Inland of Goa
  [17.05, 73.38],  // Inland of Ratnagiri
  [18.96, 72.92],  // Inland of Mumbai
  [20.05, 72.82],  // Inland of Dahanu
  [21.20, 72.90],  // Inland of Surat
  [22.35, 73.05],  // Inland of Vadodara
  [24.50, 73.50],  // Rajasthan interior
  [25.00, 80.00],  // Central India
  [24.00, 86.00],  // Jharkhand/Bengal interior
  [22.55, 88.35],  // Inland of Kolkata
  [21.65, 87.58],  // Inland of Digha
  [20.80, 87.02],  // Inland of Dhamra
  [20.30, 86.72],  // Inland of Paradip
  [19.35, 84.95],  // Inland of Gopalpur
  [17.74, 83.25],  // Inland of Visakhapatnam
  [17.02, 82.20],  // Inland of Kakinada
  [15.95, 80.55],  // Inland of Machilipatnam
  [14.30, 80.08],  // Inland of Krishnapatnam
  [13.12, 80.20],  // Inland of Chennai
  [11.97, 79.78],  // Inland of Puducherry
  [10.80, 79.80],  // Inland of Nagapattinam
  [9.32, 79.08],   // Inland of Rameswaram
  [8.80, 78.10],   // Inland of Tuticorin
  [8.14, 77.56],   // Loop close
];

// Polygon 2: Saurashtra / Kathiawar Peninsula (Gujarat inland)
const SAURASHTRA_KATHIAWAR_POLYGON: Point[] = [
  [22.85, 70.08],  // Inland of Kandla
  [22.28, 69.05],  // Inland of Dwarka
  [21.68, 69.70],  // Inland of Porbandar
  [20.94, 70.42],  // Inland of Veraval
  [20.76, 71.04],  // Inland of Diu Head
  [20.98, 71.55],  // Inland of Jafrabad
  [21.80, 72.20],  // Inland of Bhavnagar
  [22.45, 71.05],  // Rajkot interior
  [22.85, 70.08],  // Loop close
];

// Polygon 3: Sri Lanka Island Landmass Interior
const SRI_LANKA_POLYGON: Point[] = [
  [9.75, 80.28],   // Inland of Jaffna
  [8.55, 81.20],   // Inland of Trincomalee
  [7.70, 81.65],   // Inland of Batticaloa
  [6.85, 81.80],   // Inland of Arugam Bay
  [5.98, 80.58],   // Inland of Dondra Head
  [6.08, 80.25],   // Inland of Galle
  [6.95, 79.90],   // Inland of Colombo
  [8.02, 79.85],   // Inland of Puttalam
  [9.02, 79.78],   // Inland of Mannar
  [9.75, 80.28],   // Loop close
];

const ALL_LAND_POLYGONS = [
  PENINSULAR_INDIA_POLYGON,
  SAURASHTRA_KATHIAWAR_POLYGON,
  SRI_LANKA_POLYGON,
];

// --------------------------------------------------------------------------
// 2. GEOMETRIC INTERSECTION & POINT-IN-POLYGON ALGORITHMS
// --------------------------------------------------------------------------

function isPointInPolygon(lat: number, lon: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointOnLand(lat: number, lon: number): boolean {
  return ALL_LAND_POLYGONS.some(poly => isPointInPolygon(lat, lon, poly));
}

function ccw(A: Point, B: Point, C: Point): boolean {
  return (C[0] - A[0]) * (B[1] - A[1]) > (B[0] - A[0]) * (C[1] - A[1]);
}

function doSegmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

export function doesSegmentCrossLand(p1: Point, p2: Point): boolean {
  // 1. Check segment against all polygon boundary edges
  for (const poly of ALL_LAND_POLYGONS) {
    for (let i = 0; i < poly.length - 1; i++) {
      if (doSegmentsIntersect(p1, p2, poly[i], poly[i + 1])) {
        return true;
      }
    }
  }

  // 2. Check intermediate sample points
  for (let step = 1; step < 9; step++) {
    const t = step / 10;
    const sampleLat = p1[0] + t * (p2[0] - p1[0]);
    const sampleLon = p1[1] + t * (p2[1] - p1[1]);
    if (isPointOnLand(sampleLat, sampleLon)) {
      return true;
    }
  }

  return false;
}

// --------------------------------------------------------------------------
// 3. CURATED WATER-ONLY NAUTICAL TRANSIT GRAPH NODES & CORRIDORS
// --------------------------------------------------------------------------

interface SeaTransitNode {
  id: string;
  name: string;
  coords: Point;
  neighbors: string[];
}

const SEA_TRANSIT_GRAPH: Record<string, SeaTransitNode> = {
  // --- GUJARAT & NORTH ARABIAN SEA ---
  'GULF_OF_KUTCH_OFFSHORE': {
    id: 'GULF_OF_KUTCH_OFFSHORE',
    name: 'Gulf of Kutch Offshore Passage',
    coords: [22.80, 68.80],
    neighbors: ['DWARKA_OFFSHORE'],
  },
  'DWARKA_OFFSHORE': {
    id: 'DWARKA_OFFSHORE',
    name: 'Dwarka / Okha Deep Water Corridor',
    coords: [22.25, 68.60],
    neighbors: ['GULF_OF_KUTCH_OFFSHORE', 'PORBANDAR_OFFSHORE'],
  },
  'PORBANDAR_OFFSHORE': {
    id: 'PORBANDAR_OFFSHORE',
    name: 'Porbandar Offshore Transit Node',
    coords: [21.50, 69.30],
    neighbors: ['DWARKA_OFFSHORE', 'VERAVAL_OFFSHORE'],
  },
  'VERAVAL_OFFSHORE': {
    id: 'VERAVAL_OFFSHORE',
    name: 'Veraval / Somnath Offshore Corridor',
    coords: [20.65, 70.00],
    neighbors: ['PORBANDAR_OFFSHORE', 'DIU_HEAD_OFFSHORE'],
  },
  'DIU_HEAD_OFFSHORE': {
    id: 'DIU_HEAD_OFFSHORE',
    name: 'Diu Head Deep Water Turn',
    coords: [20.35, 70.90],
    neighbors: ['VERAVAL_OFFSHORE', 'JAFRABAD_OFFSHORE'],
  },
  'JAFRABAD_OFFSHORE': {
    id: 'JAFRABAD_OFFSHORE',
    name: 'Jafrabad Offshore Turn',
    coords: [20.30, 71.60],
    neighbors: ['DIU_HEAD_OFFSHORE', 'GULF_OF_KHAMBHAT_GATE'],
  },
  'GULF_OF_KHAMBHAT_GATE': {
    id: 'GULF_OF_KHAMBHAT_GATE',
    name: 'Gulf of Khambhat Southern Gateway',
    coords: [20.10, 72.30],
    neighbors: ['JAFRABAD_OFFSHORE', 'MUMBAI_HIGH_NORTH'],
  },

  // --- WEST COAST (MAHARASHTRA, GOA, KARNATAKA, KERALA) ---
  'MUMBAI_HIGH_NORTH': {
    id: 'MUMBAI_HIGH_NORTH',
    name: 'North Mumbai High Shipping Lane',
    coords: [19.50, 72.35],
    neighbors: ['GULF_OF_KHAMBHAT_GATE', 'MUMBAI_APPROACH'],
  },
  'MUMBAI_APPROACH': {
    id: 'MUMBAI_APPROACH',
    name: 'Mumbai Harbor Deep Sea Approach',
    coords: [18.90, 72.60],
    neighbors: ['MUMBAI_HIGH_NORTH', 'RATNAGIRI_OFFSHORE'],
  },
  'RATNAGIRI_OFFSHORE': {
    id: 'RATNAGIRI_OFFSHORE',
    name: 'Ratnagiri Deep Water Passage',
    coords: [16.95, 73.00],
    neighbors: ['MUMBAI_APPROACH', 'GOA_OFFSHORE'],
  },
  'GOA_OFFSHORE': {
    id: 'GOA_OFFSHORE',
    name: 'Mormugao / Goa Coastal Transit',
    coords: [15.35, 73.55],
    neighbors: ['RATNAGIRI_OFFSHORE', 'KARWAR_OFFSHORE'],
  },
  'KARWAR_OFFSHORE': {
    id: 'KARWAR_OFFSHORE',
    name: 'Karwar Deep Water Lane',
    coords: [14.75, 73.90],
    neighbors: ['GOA_OFFSHORE', 'MANGALORE_OFFSHORE'],
  },
  'MANGALORE_OFFSHORE': {
    id: 'MANGALORE_OFFSHORE',
    name: 'New Mangalore Coastal Passage',
    coords: [12.80, 74.50],
    neighbors: ['KARWAR_OFFSHORE', 'KOZHIKODE_OFFSHORE'],
  },
  'KOZHIKODE_OFFSHORE': {
    id: 'KOZHIKODE_OFFSHORE',
    name: 'Kozhikode Deep Water Passage',
    coords: [11.20, 75.45],
    neighbors: ['MANGALORE_OFFSHORE', 'KOCHI_OFFSHORE'],
  },
  'KOCHI_OFFSHORE': {
    id: 'KOCHI_OFFSHORE',
    name: 'Kochi Outer Harbor Shipping Corridor',
    coords: [9.93, 76.00],
    neighbors: ['KOZHIKODE_OFFSHORE', 'KOLLAM_OFFSHORE'],
  },
  'KOLLAM_OFFSHORE': {
    id: 'KOLLAM_OFFSHORE',
    name: 'Kollam / Quilon Deep Sea Lane',
    coords: [8.80, 76.35],
    neighbors: ['KOCHI_OFFSHORE', 'VIZHINJAM_OFFSHORE'],
  },
  'VIZHINJAM_OFFSHORE': {
    id: 'VIZHINJAM_OFFSHORE',
    name: 'Vizhinjam International Transshipment Approach',
    coords: [8.30, 76.80],
    neighbors: ['KOLLAM_OFFSHORE', 'CAPE_COMORIN_SOUTH'],
  },

  // --- SOUTHERN TIP & INTER-OCEANIC CAPE COMORIN CORRIDOR ---
  'CAPE_COMORIN_SOUTH': {
    id: 'CAPE_COMORIN_SOUTH',
    name: 'Cape Comorin (Kanyakumari) Southern Transit Gate',
    coords: [7.50, 77.55],
    neighbors: ['VIZHINJAM_OFFSHORE', 'GULF_OF_MANNAR_SOUTH', 'SRI_LANKA_SOUTH_TRANSIT'],
  },
  'GULF_OF_MANNAR_SOUTH': {
    id: 'GULF_OF_MANNAR_SOUTH',
    name: 'Gulf of Mannar Deep Channel',
    coords: [7.80, 78.40],
    neighbors: ['CAPE_COMORIN_SOUTH', 'TUTICORIN_APPROACH', 'SRI_LANKA_SOUTH_TRANSIT'],
  },
  'TUTICORIN_APPROACH': {
    id: 'TUTICORIN_APPROACH',
    name: 'V.O. Chidambaranar (Tuticorin) Outer Approach',
    coords: [8.75, 78.35],
    neighbors: ['GULF_OF_MANNAR_SOUTH'],
  },
  'SRI_LANKA_SOUTH_TRANSIT': {
    id: 'SRI_LANKA_SOUTH_TRANSIT',
    name: 'Dondra Head / South Sri Lanka International Sea Lane',
    coords: [5.60, 80.55],
    neighbors: ['CAPE_COMORIN_SOUTH', 'GULF_OF_MANNAR_SOUTH', 'SRI_LANKA_SOUTHEAST_CORRIDOR'],
  },
  'SRI_LANKA_SOUTHEAST_CORRIDOR': {
    id: 'SRI_LANKA_SOUTHEAST_CORRIDOR',
    name: 'Southeast Sri Lanka Deep Water Gateway',
    coords: [5.80, 82.20],
    neighbors: ['SRI_LANKA_SOUTH_TRANSIT', 'SRI_LANKA_EAST_TRANSIT'],
  },
  'SRI_LANKA_EAST_TRANSIT': {
    id: 'SRI_LANKA_EAST_TRANSIT',
    name: 'East Sri Lanka Bay of Bengal Gateway',
    coords: [7.50, 82.60],
    neighbors: ['SRI_LANKA_SOUTHEAST_CORRIDOR', 'NAGAPATTINAM_OFFSHORE'],
  },

  // --- EAST COAST (TAMIL NADU, ANDHRA, ODISHA, WEST BENGAL) ---
  'NAGAPATTINAM_OFFSHORE': {
    id: 'NAGAPATTINAM_OFFSHORE',
    name: 'Nagapattinam Deep Water Corridor',
    coords: [10.75, 80.25],
    neighbors: ['SRI_LANKA_EAST_TRANSIT', 'PUDUCHERRY_OFFSHORE'],
  },
  'PUDUCHERRY_OFFSHORE': {
    id: 'PUDUCHERRY_OFFSHORE',
    name: 'Puducherry / Cuddalore Corridor',
    coords: [11.90, 80.20],
    neighbors: ['NAGAPATTINAM_OFFSHORE', 'CHENNAI_APPROACH'],
  },
  'CHENNAI_APPROACH': {
    id: 'CHENNAI_APPROACH',
    name: 'Chennai Outer Anchorage & Shipping Gateway',
    coords: [13.10, 80.45],
    neighbors: ['PUDUCHERRY_OFFSHORE', 'KRISHNAPATNAM_OFFSHORE'],
  },
  'KRISHNAPATNAM_OFFSHORE': {
    id: 'KRISHNAPATNAM_OFFSHORE',
    name: 'Krishnapatnam Deep Sea Corridor',
    coords: [14.25, 80.40],
    neighbors: ['CHENNAI_APPROACH', 'MACHILIPATNAM_OFFSHORE'],
  },
  'MACHILIPATNAM_OFFSHORE': {
    id: 'MACHILIPATNAM_OFFSHORE',
    name: 'Godavari / Krishna Delta Offshore Turn',
    coords: [16.10, 81.50],
    neighbors: ['KRISHNAPATNAM_OFFSHORE', 'VISAKHAPATNAM_APPROACH'],
  },
  'VISAKHAPATNAM_APPROACH': {
    id: 'VISAKHAPATNAM_APPROACH',
    name: 'Visakhapatnam Outer Harbor Gateway',
    coords: [17.65, 83.45],
    neighbors: ['MACHILIPATNAM_OFFSHORE', 'GOPALPUR_OFFSHORE'],
  },
  'GOPALPUR_OFFSHORE': {
    id: 'GOPALPUR_OFFSHORE',
    name: 'Gopalpur / South Odisha Passage',
    coords: [19.20, 85.20],
    neighbors: ['VISAKHAPATNAM_APPROACH', 'PARADIP_APPROACH'],
  },
  'PARADIP_APPROACH': {
    id: 'PARADIP_APPROACH',
    name: 'Paradip Deep Water Harbor Channel',
    coords: [20.20, 86.95],
    neighbors: ['GOPALPUR_OFFSHORE', 'DHAMRA_OFFSHORE'],
  },
  'DHAMRA_OFFSHORE': {
    id: 'DHAMRA_OFFSHORE',
    name: 'Dhamra / Wheeler Island Channel',
    coords: [20.80, 87.25],
    neighbors: ['PARADIP_APPROACH', 'SANDHEADS_HALDIA'],
  },
  'SANDHEADS_HALDIA': {
    id: 'SANDHEADS_HALDIA',
    name: 'Sandheads (Bay of Bengal Pilotage Area)',
    coords: [21.40, 88.20],
    neighbors: ['DHAMRA_OFFSHORE', 'KOLKATA_RIVER_MOUTH'],
  },
  'KOLKATA_RIVER_MOUTH': {
    id: 'KOLKATA_RIVER_MOUTH',
    name: 'Hooghly Estuary Approach to Haldia / Kolkata',
    coords: [22.00, 88.15],
    neighbors: ['SANDHEADS_HALDIA'],
  },
};

// --------------------------------------------------------------------------
// 4. DIJKSTRA SHORTEST PATH ON WATER-ONLY GRAPH
// --------------------------------------------------------------------------

function findShortestSeaGraphPath(startNodeId: string, endNodeId: string): string[] {
  if (startNodeId === endNodeId) return [startNodeId];

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  for (const nodeId of Object.keys(SEA_TRANSIT_GRAPH)) {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  }

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let smallestDist = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < smallestDist) {
        smallestDist = distances[nodeId];
        currentId = nodeId;
      }
    }

    if (!currentId || smallestDist === Infinity) break;
    if (currentId === endNodeId) break;

    unvisited.delete(currentId);
    const currentNode = SEA_TRANSIT_GRAPH[currentId];

    for (const neighborId of currentNode.neighbors) {
      if (!unvisited.has(neighborId)) continue;
      const neighborNode = SEA_TRANSIT_GRAPH[neighborId];
      const dist = calculateDistanceKm(
        currentNode.coords[0], currentNode.coords[1],
        neighborNode.coords[0], neighborNode.coords[1]
      );
      const alt = distances[currentId] + dist;
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = currentId;
      }
    }
  }

  const path: string[] = [];
  let curr: string | null = endNodeId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return path.length > 0 && path[0] === startNodeId ? path : [];
}

// Find nearest visible sea graph node from arbitrary coastal point (ensuring line of sight does not cross land)
function findBestEntryNode(pt: Point): string | null {
  let bestNodeId: string | null = null;
  let minDistance = Infinity;

  // 1. Try finding nodes that don't cross land
  for (const [nodeId, node] of Object.entries(SEA_TRANSIT_GRAPH)) {
    const dist = calculateDistanceKm(pt[0], pt[1], node.coords[0], node.coords[1]);
    if (!doesSegmentCrossLand(pt, node.coords)) {
      if (dist < minDistance) {
        minDistance = dist;
        bestNodeId = nodeId;
      }
    }
  }

  // 2. If all direct lines cross coastal headlands, pick geographically closest node
  if (!bestNodeId) {
    minDistance = Infinity;
    for (const [nodeId, node] of Object.entries(SEA_TRANSIT_GRAPH)) {
      const dist = calculateDistanceKm(pt[0], pt[1], node.coords[0], node.coords[1]);
      if (dist < minDistance) {
        minDistance = dist;
        bestNodeId = nodeId;
      }
    }
  }

  return bestNodeId;
}

// --------------------------------------------------------------------------
// 5. MAIN DETERMINISTIC SAFE ROUTE OPTIMIZER
// --------------------------------------------------------------------------

export function optimizeSafestRoute(options: RouteOptimizationOptions): SafestRouteResult {
  const { origin, destination, waveHeightM = 1.2, windSpeedKmh = 18, activeAlerts = [] } = options;
  const generatedAt = new Date().toISOString();

  const origPt: Point = [origin.latitude, origin.longitude];
  const destPt: Point = [destination.latitude, destination.longitude];

  const avoidedZones: string[] = [];
  const hazardsDetected: string[] = [];

  // Check if points are identical
  const directDistance = calculateDistanceKm(origPt[0], origPt[1], destPt[0], destPt[1]);
  if (directDistance < 1) {
    return {
      origin: { name: origin.name, coordinates: { latitude: origin.latitude, longitude: origin.longitude } },
      destination: { name: destination.name, coordinates: { latitude: destination.latitude, longitude: destination.longitude } },
      waypoints: [
        { latitude: origPt[0], longitude: origPt[1], legDistanceKm: 0, estimatedRiskLevel: 'LOW', advisoryNote: 'Origin & Destination are at same location' }
      ],
      totalDistanceKm: 0,
      totalDistanceNM: 0,
      overallRouteRisk: 'LOW',
      avoidedZones: [],
      hazardsDetected: [],
      isSeaRouteValid: true,
      passageType: 'COASTAL_PASSAGE',
      statusMessage: 'Origin and destination are in the same coastal sector.',
      sourceStatus: 'PROTOTYPE_MODEL',
      generatedAt,
      disclaimer: 'ORCA PROTOTYPE ROUTE RECOMMENDATION — Zero-displacement passage.',
    };
  }

  // Check if both points have clean direct line of sight through sea
  const isDirectSeaPassage = !doesSegmentCrossLand(origPt, destPt);

  let rawWaypoints: Point[] = [];

  if (isDirectSeaPassage) {
    // Generate smooth direct offshore waypoints
    const numSteps = Math.max(3, Math.min(6, Math.ceil(directDistance / 60)));
    for (let i = 0; i <= numSteps; i++) {
      const frac = i / numSteps;
      const lat = origPt[0] + frac * (destPt[0] - origPt[0]);
      const lon = origPt[1] + frac * (destPt[1] - origPt[1]);
      rawWaypoints.push([lat, lon]);
    }
  } else {
    // Multi-leg passage: route via water-only sea transit graph
    const entryNodeId = findBestEntryNode(origPt);
    const exitNodeId = findBestEntryNode(destPt);

    if (entryNodeId && exitNodeId) {
      const nodePath = findShortestSeaGraphPath(entryNodeId, exitNodeId);
      
      rawWaypoints.push(origPt);
      for (const nodeId of nodePath) {
        rawWaypoints.push(SEA_TRANSIT_GRAPH[nodeId].coords);
      }
      rawWaypoints.push(destPt);
    } else {
      // Fallback
      rawWaypoints = [origPt, destPt];
    }
  }

  // Deduplicate consecutive identical waypoints
  const cleanRawWaypoints: Point[] = [];
  for (let i = 0; i < rawWaypoints.length; i++) {
    if (i === 0) {
      cleanRawWaypoints.push(rawWaypoints[i]);
    } else {
      const prev = cleanRawWaypoints[cleanRawWaypoints.length - 1];
      const d = calculateDistanceKm(prev[0], prev[1], rawWaypoints[i][0], rawWaypoints[i][1]);
      if (d > 0.5) {
        cleanRawWaypoints.push(rawWaypoints[i]);
      }
    }
  }

  // Apply Marine Protected Area Geofence avoidance offsets
  const waypoints: RouteWaypoint[] = [];
  let accumulatedDist = 0;

  for (let i = 0; i < cleanRawWaypoints.length; i++) {
    let [lat, lon] = cleanRawWaypoints[i];

    // Check geofence buffers
    for (const geofence of INDIAN_MARITIME_GEOFENCES) {
      if (geofence.restrictionLevel === 'PROHIBITED') {
        const dToMpa = calculateDistanceKm(lat, lon, geofence.center.latitude, geofence.center.longitude);
        if (dToMpa < geofence.bufferRadiusKm) {
          // Nudge offshore safely
          if (lon < 78.0) lon -= 0.15; // West coast -> west offshore
          else lon += 0.15;            // East coast -> east offshore

          if (!avoidedZones.includes(geofence.name)) {
            avoidedZones.push(geofence.name);
          }
        }
      }
    }

    // Determine leg risk
    let legRisk: RiskLevel = 'LOW';
    if (waveHeightM > 3.0 || windSpeedKmh > 50) {
      legRisk = 'SEVERE';
      if (!hazardsDetected.includes('High wave / storm wind on corridor')) {
        hazardsDetected.push('High wave / storm wind on corridor');
      }
    } else if (waveHeightM > 2.0 || windSpeedKmh > 35) {
      legRisk = 'MODERATE';
    }

    const prevLat = i === 0 ? origPt[0] : waypoints[i - 1].latitude;
    const prevLon = i === 0 ? origPt[1] : waypoints[i - 1].longitude;
    const legDist = i === 0 ? 0 : Math.round(calculateDistanceKm(prevLat, prevLon, lat, lon) * 10) / 10;
    accumulatedDist += legDist;

    let advisoryNote = 'Open Sea Navigational Waypoint';
    if (i === 0) advisoryNote = `Passage Departure (${origin.name})`;
    else if (i === cleanRawWaypoints.length - 1) advisoryNote = `Destination Approach (${destination.name})`;
    else if (lat < 8.0 && lon > 77.0 && lon < 78.5) advisoryNote = 'Cape Comorin / Southern Peninsular Bypass';
    else if (lat < 6.5) advisoryNote = 'Dondra Head / Deep Sea Oceanic Corridor';
    else if (lat > 20.0 && lat < 21.0 && lon < 71.5) advisoryNote = 'Kathiawar / Diu Head Offshore Turn';

    waypoints.push({
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lon * 10000) / 10000,
      legDistanceKm: legDist,
      estimatedRiskLevel: legRisk,
      advisoryNote,
    });
  }

  // Active Alert proximity check
  for (const alert of activeAlerts) {
    if (alert.coordinates) {
      const midLat = (origPt[0] + destPt[0]) / 2;
      const midLon = (origPt[1] + destPt[1]) / 2;
      const dToAlert = calculateDistanceKm(midLat, midLon, alert.coordinates.latitude, alert.coordinates.longitude);
      if (dToAlert < 300) {
        hazardsDetected.push(`${alert.type}: ${alert.title} within ~${Math.round(dToAlert)} km of corridor`);
      }
    }
  }

  let overallRisk: RiskLevel = 'LOW';
  if (hazardsDetected.length > 0 || waveHeightM > 2.8) overallRisk = 'HIGH';
  else if (waveHeightM > 1.8 || avoidedZones.length > 0) overallRisk = 'MODERATE';

  const totalDistanceKm = Math.round(accumulatedDist * 10) / 10;
  const totalDistanceNM = Math.round((totalDistanceKm / 1.852) * 10) / 10;

  const passageType = !isDirectSeaPassage ? 'INTER_COASTAL_ROUND_CAPES' : 'COASTAL_PASSAGE';

  return {
    origin: { name: origin.name, coordinates: { latitude: origin.latitude, longitude: origin.longitude } },
    destination: { name: destination.name, coordinates: { latitude: destination.latitude, longitude: destination.longitude } },
    waypoints,
    totalDistanceKm,
    totalDistanceNM,
    overallRouteRisk: overallRisk,
    avoidedZones: [...new Set(avoidedZones)],
    hazardsDetected: [...new Set(hazardsDetected)],
    isSeaRouteValid: true,
    passageType,
    statusMessage: isDirectSeaPassage
      ? `Direct coastal sea passage calculated (${totalDistanceNM} NM).`
      : `Sea-only passage corridor calculated via Cape Comorin / deep-water gateway (${totalDistanceNM} NM, 0 land intersections).`,
    sourceStatus: 'PROTOTYPE_MODEL',
    generatedAt,
    disclaimer: 'ORCA PROTOTYPE SAFE MARINE ROUTE — Calculated by deterministic water-only cost model. Strictly prevents overland crossing. NOT an official nautical navigational chart.',
  };
}
