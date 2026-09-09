/**
 * ORCA Maritime Geofencing & Marine Protected Area (MPA) Service
 * 
 * Sources & Reference:
 * - Wildlife Institute of India (WII) / MoEFCC Marine Protected Areas Database
 * - Indian Coastal Regulation Zone (CRZ-I) Ecologically Sensitive Zones
 * - UNCLOS International Maritime Boundary Line (IMBL) Reference Coordinates
 * 
 * Provenance: REFERENCE (Curated authoritative geographic boundaries)
 */

import { Coordinates } from '../types';
import { calculateDistanceKm } from '../geospatial';

export type GeofenceCategory = 
  | 'MARINE_PROTECTED_AREA'
  | 'ECOLOGICALLY_SENSITIVE'
  | 'INTERNATIONAL_BOUNDARY'
  | 'RESTRICTED_DEFENCE_ZONE'
  | 'FISHERY_CLOSED_SEASON';

export type GeofenceRestrictionLevel = 'PROHIBITED' | 'CAUTION' | 'REGULATED' | 'ADVISORY';

export interface GeofenceZone {
  id: string;
  name: string;
  category: GeofenceCategory;
  restrictionLevel: GeofenceRestrictionLevel;
  stateOrRegion: string;
  authority: string;
  description: string;
  legalBasis: string;
  source: string;
  sourceType: 'REFERENCE';
  coordinates: [number, number][]; // Array of [lat, lon] forming polygon
  center: { latitude: number; longitude: number };
  bufferRadiusKm: number;
}

export interface GeofenceCheckResult {
  insideZones: GeofenceZone[];
  nearbyZones: Array<{ zone: GeofenceZone; distanceKm: number; distanceNM: number }>;
  isRestricted: boolean;
  warnings: string[];
  sourceAttribution: string;
  retrievedAt: string;
}

// ---------------------------------------------------------------------------
// Curated Indian Marine Protected Areas & Maritime Geofences
// ---------------------------------------------------------------------------

export const INDIAN_MARITIME_GEOFENCES: GeofenceZone[] = [
  {
    id: 'mpa-gulf-of-mannar',
    name: 'Gulf of Mannar Marine National Park & Biosphere Reserve',
    category: 'MARINE_PROTECTED_AREA',
    restrictionLevel: 'PROHIBITED',
    stateOrRegion: 'Tamil Nadu',
    authority: 'Tamil Nadu Forest Department / MoEFCC',
    description: '21 coral islands with rich marine biodiversity (Dugongs, Sea turtles, Sea cucumbers). Commercial trawling & mechanized fishing prohibited.',
    legalBasis: 'Wildlife Protection Act, 1972 / CRZ-I',
    source: 'Ministry of Environment, Forest and Climate Change (MoEFCC) / WII MPA Database',
    sourceType: 'REFERENCE',
    center: { latitude: 9.15, longitude: 78.95 },
    bufferRadiusKm: 25,
    coordinates: [
      [9.35, 78.75],
      [9.35, 79.25],
      [8.95, 79.10],
      [8.95, 78.60],
      [9.35, 78.75],
    ],
  },
  {
    id: 'mpa-gulf-of-kutch',
    name: 'Marine National Park & Sanctuary (Gulf of Kutch)',
    category: 'MARINE_PROTECTED_AREA',
    restrictionLevel: 'PROHIBITED',
    stateOrRegion: 'Gujarat',
    authority: 'Gujarat Forest Dept / MoEFCC',
    description: 'First Marine National Park in India. Mangroves, coral reefs, and pearl oyster beds. Commercial anchoring and unauthorized fishing restricted.',
    legalBasis: 'Wildlife Protection Act, 1972',
    source: 'Gujarat Ecological Commission / MoEFCC',
    sourceType: 'REFERENCE',
    center: { latitude: 22.45, longitude: 69.75 },
    bufferRadiusKm: 20,
    coordinates: [
      [22.60, 69.30],
      [22.65, 70.15],
      [22.35, 70.10],
      [22.30, 69.40],
      [22.60, 69.30],
    ],
  },
  {
    id: 'mpa-malvan',
    name: 'Malvan Marine Sanctuary',
    category: 'ECOLOGICALLY_SENSITIVE',
    restrictionLevel: 'REGULATED',
    stateOrRegion: 'Maharashtra',
    authority: 'Maharashtra Forest Department',
    description: 'Rich coral and marine biodiversity around Sindhudurg Fort. Trawling restricted within core zone.',
    legalBasis: 'Wildlife Protection Act, 1972',
    source: 'Maharashtra Forest Department / WII',
    sourceType: 'REFERENCE',
    center: { latitude: 16.05, longitude: 73.45 },
    bufferRadiusKm: 12,
    coordinates: [
      [16.12, 73.40],
      [16.12, 73.52],
      [15.98, 73.52],
      [15.98, 73.40],
      [16.12, 73.40],
    ],
  },
  {
    id: 'mpa-gahirmatha',
    name: 'Gahirmatha Marine Sanctuary (Olive Ridley Nesting Zone)',
    category: 'ECOLOGICALLY_SENSITIVE',
    restrictionLevel: 'PROHIBITED',
    stateOrRegion: 'Odisha',
    authority: 'Odisha Forest & Environment Dept',
    description: "World's largest Olive Ridley sea turtle nesting beach & coastal waters. Mechanized fishing prohibited during November-May breeding season.",
    legalBasis: 'Odisha Marine Fishing Regulation Act (OMFRA), 1982',
    source: 'Odisha Forest Department / Wildlife Institute of India',
    sourceType: 'REFERENCE',
    center: { latitude: 20.72, longitude: 87.05 },
    bufferRadiusKm: 30,
    coordinates: [
      [20.90, 86.85],
      [20.90, 87.25],
      [20.50, 87.25],
      [20.50, 86.85],
      [20.90, 86.85],
    ],
  },
  {
    id: 'imbl-sri-lanka-buffer',
    name: 'Palk Bay / Gulf of Mannar IMBL Advisory Zone',
    category: 'INTERNATIONAL_BOUNDARY',
    restrictionLevel: 'CAUTION',
    stateOrRegion: 'Tamil Nadu / International Waters',
    authority: 'Indian Coast Guard / Maritime Enforcement',
    description: 'International Maritime Boundary Line (IMBL) proximity buffer. Strict advisory for Indian fishing boats to prevent international border crossing.',
    legalBasis: 'India-Sri Lanka Maritime Agreements (1974/1976)',
    source: 'Indian Coast Guard / Ministry of External Affairs Reference',
    sourceType: 'REFERENCE',
    center: { latitude: 9.60, longitude: 79.55 },
    bufferRadiusKm: 15,
    coordinates: [
      [10.05, 79.80],
      [9.80, 80.05],
      [9.20, 79.50],
      [9.00, 79.20],
      [9.35, 79.05],
      [10.05, 79.80],
    ],
  },
];

// ---------------------------------------------------------------------------
// Point-in-Polygon Ray Casting Algorithm
// ---------------------------------------------------------------------------

function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lon) !== (yj > lon)) &&
      (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ---------------------------------------------------------------------------
// Geofence Checking Service
// ---------------------------------------------------------------------------

export function checkGeofences(lat: number, lon: number, searchRadiusKm = 50): GeofenceCheckResult {
  const retrievedAt = new Date().toISOString();
  const insideZones: GeofenceZone[] = [];
  const nearbyZones: Array<{ zone: GeofenceZone; distanceKm: number; distanceNM: number }> = [];
  const warnings: string[] = [];

  for (const zone of INDIAN_MARITIME_GEOFENCES) {
    const isInside = isPointInPolygon(lat, lon, zone.coordinates);
    if (isInside) {
      insideZones.push(zone);
      warnings.push(`⚠️ CURRENT POSITION IS INSIDE RESTRICTED/PROTECTED ZONE: ${zone.name} (${zone.restrictionLevel}). ${zone.description}`);
    } else {
      const distKm = calculateDistanceKm(lat, lon, zone.center.latitude, zone.center.longitude);
      if (distKm <= searchRadiusKm) {
        const distNM = Math.round((distKm / 1.852) * 10) / 10;
        nearbyZones.push({ zone, distanceKm: Math.round(distKm * 10) / 10, distanceNM: distNM });
        if (distKm <= zone.bufferRadiusKm) {
          warnings.push(`ℹ️ Proximity Warning: ~${distKm.toFixed(1)} km from ${zone.name} (${zone.restrictionLevel}).`);
        }
      }
    }
  }

  // Sort nearby zones by distance
  nearbyZones.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    insideZones,
    nearbyZones,
    isRestricted: insideZones.some(z => z.restrictionLevel === 'PROHIBITED'),
    warnings,
    sourceAttribution: 'MoEFCC / WII Marine Protected Areas & Coast Guard IMBL Reference Database',
    retrievedAt,
  };
}
