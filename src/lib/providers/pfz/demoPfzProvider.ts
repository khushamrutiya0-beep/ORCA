/**
 * ORCA Demo PFZ Provider
 * Returns clearly labelled DEMO PFZ zones.
 * Status is always DEMO — never LIVE.
 * Used until INCOIS provides a verified machine-readable API.
 *
 * All zones are clearly marked:
 * - advisoryType: 'DEMO_SAMPLE'
 * - status: 'DEMO'
 * - source: 'ORCA DEMO Dataset (NOT INCOIS)'
 */

import { IPfzProvider } from './IPfzProvider';
import { PFZProviderResult, PFZZoneM5 } from '../../types/alert';

const DEMO_DISCLAIMER =
  'DEMO DATA — NOT FOR OPERATIONAL USE. ' +
  'Live verified PFZ data from INCOIS is not currently connected. ' +
  'INCOIS does not provide a public machine-readable API. ' +
  'These zones are ORCA demonstration samples only.';

function generateDemoPfzZones(lat: number, lon: number, retrievedAt: string): PFZZoneM5[] {
  const today = new Date();
  const validFrom = today.toISOString().split('T')[0] + 'T05:30:00+05:30';
  const validUntil = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T05:30:00+05:30';

  // Generate demo zones at plausible offsets from query location
  // These are NOT real PFZ data — clearly demo
  const demoOffsets = [
    { dlat: 1.2, dlon: -0.8, name: 'DEMO Zone Alpha — Offshore Shelf Edge' },
    { dlat: -0.6, dlon: 1.5, name: 'DEMO Zone Beta — Mid-Sea Upwelling Region' },
    { dlat: 2.0, dlon: 0.3, name: 'DEMO Zone Gamma — High Productivity Area' },
  ];

  return demoOffsets.map((offset, i) => {
    const centerLat = Math.max(5, Math.min(25, lat + offset.dlat));
    const centerLon = Math.max(55, Math.min(100, lon + offset.dlon));

    // Simple square demo polygon (0.3° sides)
    const d = 0.15;
    const polygon: [number, number][] = [
      [centerLon - d, centerLat - d],
      [centerLon + d, centerLat - d],
      [centerLon + d, centerLat + d],
      [centerLon - d, centerLat + d],
      [centerLon - d, centerLat - d],
    ];

    return {
      id: `demo-pfz-${i + 1}-${today.toISOString().split('T')[0]}`,
      name: offset.name,
      centerCoordinates: { latitude: centerLat, longitude: centerLon },
      polygon,
      validFrom,
      validUntil,
      source: 'ORCA DEMO Dataset — NOT INCOIS',
      sourceType: 'DEMO' as const,
      status: 'DEMO' as const,
      advisoryType: 'DEMO_SAMPLE' as const,
      confidence: 'DEMO — not applicable',
      metadata: {
        generatedAt: retrievedAt,
        reason: 'INCOIS PFZ API not publicly accessible. DEMO data only.',
      },
    };
  });
}

export class DemoPfzProvider implements IPfzProvider {
  readonly id = 'demo-pfz';
  readonly name = 'ORCA Demo PFZ Provider';
  readonly status = 'DEMO' as const;

  async getPFZZones(lat: number, lon: number): Promise<PFZProviderResult> {
    const retrievedAt = new Date().toISOString();
    const zones = generateDemoPfzZones(lat, lon, retrievedAt);

    return {
      source: 'ORCA DEMO Dataset — NOT INCOIS. For real PFZ data visit incois.gov.in',
      sourceType: 'DEMO',
      status: 'DEMO',
      zones,
      retrievedAt,
      disclaimer: DEMO_DISCLAIMER,
    };
  }
}

export const demoPfzProvider = new DemoPfzProvider();
