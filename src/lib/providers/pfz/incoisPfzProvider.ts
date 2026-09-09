/**
 * ORCA INCOIS PFZ Provider — UNAVAILABLE STUB
 * Source: Indian National Centre for Ocean Information Services (INCOIS)
 * Status: UNAVAILABLE — No public machine-readable API exists
 *
 * Research findings (2026-08-24):
 * - INCOIS provides PFZ data via WebGIS (incois.gov.in) and SAMUDRA app
 * - No REST/JSON API is publicly available for programmatic access
 * - Institutional collaboration or data-sharing agreement required
 *
 * To integrate when INCOIS API becomes available:
 * 1. Set INCOIS_PFZ_API_KEY and INCOIS_PFZ_ENDPOINT environment variables
 * 2. Implement actual API call and response normalization
 * 3. Update provider status to 'LIVE' only after successful test
 */

import { IPfzProvider } from './IPfzProvider';
import { PFZProviderResult } from '../../types/alert';

export class IncoisPfzProvider implements IPfzProvider {
  readonly id = 'incois-pfz';
  readonly name = 'INCOIS PFZ Provider (Unavailable)';
  readonly status = 'UNAVAILABLE' as const;

  async getPFZZones(_lat: number, _lon: number): Promise<PFZProviderResult> {
    return {
      source: 'INCOIS — Indian National Centre for Ocean Information Services',
      sourceType: 'UNAVAILABLE',
      status: 'UNAVAILABLE',
      zones: [],
      retrievedAt: new Date().toISOString(),
      disclaimer:
        'INCOIS does not provide a public machine-readable PFZ API. ' +
        'Live PFZ data requires institutional access. ' +
        'ORCA is currently using DEMO PFZ data. ' +
        'For real PFZ advisories, visit: https://incois.gov.in or use the SAMUDRA app.',
      error: 'INCOIS PFZ API not publicly accessible. No machine-readable endpoint available.',
    };
  }
}

export const incoisPfzProvider = new IncoisPfzProvider();
