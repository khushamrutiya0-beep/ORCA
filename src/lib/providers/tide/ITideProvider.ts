/**
 * ORCA Tide Intelligence Provider Interface
 * 
 * Research Status (2026-08-25):
 * - Survey of India (SoI) Geodetic Branch and INCOIS operate Indian tide gauge networks.
 * - No unauthenticated, machine-readable REST API is publicly accessible for real-time astronomical tide predictions.
 * - Status is honestly reported as UNAVAILABLE with station reference data, never fabricating tide levels.
 */

import { DataStatus } from '../../types';

export interface TideStation {
  id: string;
  name: string;
  state: string;
  coordinates: { latitude: number; longitude: number };
  datum: string; // e.g. "Chart Datum (CD)"
}

export interface TideObservation {
  station: TideStation;
  status: DataStatus;
  source: string;
  sourceType: 'LIVE' | 'DEMO' | 'REFERENCE' | 'UNAVAILABLE';
  currentTideLevelMeters: number | null;
  tideState: 'FLOOD' | 'EBB' | 'HIGH' | 'LOW' | 'UNKNOWN';
  nextHighTideTime?: string | null;
  nextHighTideHeightM?: number | null;
  nextLowTideTime?: string | null;
  nextLowTideHeightM?: number | null;
  retrievedAt: string;
  disclaimer: string;
  error?: string;
}

export interface ITideProvider {
  readonly id: string;
  readonly name: string;
  readonly status: DataStatus;

  getTideForecast(lat: number, lon: number): Promise<TideObservation>;
}

// Curated primary Indian tide gauge reference stations (Survey of India / Port Trusts)
export const INDIAN_TIDE_STATIONS: TideStation[] = [
  { id: 'tide-mumbai', name: 'Mumbai (Apollo Bunder)', state: 'Maharashtra', coordinates: { latitude: 18.9220, longitude: 72.8347 }, datum: 'Chart Datum (CD)' },
  { id: 'tide-kochi', name: 'Kochi (Willingdon Island)', state: 'Kerala', coordinates: { latitude: 9.9600, longitude: 76.2700 }, datum: 'Chart Datum (CD)' },
  { id: 'tide-chennai', name: 'Chennai Port', state: 'Tamil Nadu', coordinates: { latitude: 13.0850, longitude: 80.2950 }, datum: 'Chart Datum (CD)' },
  { id: 'tide-kandla', name: 'Kandla (Gulf of Kutch)', state: 'Gujarat', coordinates: { latitude: 23.0100, longitude: 70.2200 }, datum: 'Chart Datum (CD)' },
  { id: 'tide-vizag', name: 'Visakhapatnam Outer Harbour', state: 'Andhra Pradesh', coordinates: { latitude: 17.6900, longitude: 83.3000 }, datum: 'Chart Datum (CD)' },
  { id: 'tide-paradip', name: 'Paradip Port', state: 'Odisha', coordinates: { latitude: 20.2600, longitude: 86.6700 }, datum: 'Chart Datum (CD)' },
];

export class UnavailableTideProvider implements ITideProvider {
  readonly id = 'soi-incois-tides';
  readonly name = 'Survey of India / INCOIS Tide Network';
  readonly status: DataStatus = 'UNAVAILABLE';

  async getTideForecast(lat: number, lon: number): Promise<TideObservation> {
    const retrievedAt = new Date().toISOString();
    
    // Find nearest reference station
    let nearest = INDIAN_TIDE_STATIONS[0];
    let minDist = Infinity;
    for (const station of INDIAN_TIDE_STATIONS) {
      const dLat = station.coordinates.latitude - lat;
      const dLon = station.coordinates.longitude - lon;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < minDist) {
        minDist = dist;
        nearest = station;
      }
    }

    return {
      station: nearest,
      status: 'UNAVAILABLE',
      source: 'Survey of India (SoI) / INCOIS National Tide Gauge Network',
      sourceType: 'UNAVAILABLE',
      currentTideLevelMeters: null,
      tideState: 'UNKNOWN',
      retrievedAt,
      disclaimer: 'TIDE DATA UNAVAILABLE — Survey of India (SoI) / INCOIS official tide tables require registered institutional access. No open programmatic REST API is currently connected. Real-time astronomical tide heights are not fabricated.',
      error: 'Public machine-readable tide API endpoint is not connected.',
    };
  }
}

export const tideProvider = new UnavailableTideProvider();
