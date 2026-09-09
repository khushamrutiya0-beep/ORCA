import { INDIAN_COASTAL_PORTS, PortRecord } from './indianPorts';
import { NearestPortInfo, GeoRestriction } from '../types';

export * from './indianPorts';

/**
 * Calculate Great Circle Distance between two coordinates in kilometers (Haversine formula).
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

export function kmToNauticalMiles(km: number): number {
  return Math.round((km / 1.852) * 10) / 10;
}

/**
 * Finds the closest known Indian coastal port from a given ocean coordinate.
 */
export function findNearestPort(latitude: number, longitude: number): NearestPortInfo {
  let nearestPort: PortRecord = INDIAN_COASTAL_PORTS[0];
  let minDistanceKm = Infinity;

  for (const port of INDIAN_COASTAL_PORTS) {
    const dist = calculateDistanceKm(latitude, longitude, port.coordinates[0], port.coordinates[1]);
    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      nearestPort = port;
    }
  }

  return {
    portName: nearestPort.name,
    state: nearestPort.state,
    type: nearestPort.type,
    distanceKm: minDistanceKm,
    distanceNM: kmToNauticalMiles(minDistanceKm),
    coordinates: nearestPort.coordinates,
  };
}

/**
 * Geospatial Zone Restriction Service Interface
 * Prepares the point-in-zone architecture for future verified maritime boundaries.
 */
export interface IGeofenceService {
  checkRestrictions(latitude: number, longitude: number): Promise<{
    restrictions: GeoRestriction[];
    status: 'LIVE' | 'DEMO' | 'UNAVAILABLE';
    message: string;
  }>;
}

export class GeofenceService implements IGeofenceService {
  async checkRestrictions(lat: number, lon: number) {
    // Verified official maritime restriction datasets are in development
    // Clearly returning UNAVAILABLE / STANDBY rather than inventing unverified polygons (Rule 2 & Milestone 3 Part 5)
    return {
      restrictions: [],
      status: 'UNAVAILABLE' as const,
      message: 'Verified real-time maritime boundary restriction polygons are currently DATA_UNAVAILABLE.',
    };
  }
}

export const geofenceService = new GeofenceService();
