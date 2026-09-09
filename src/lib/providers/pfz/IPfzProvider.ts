/**
 * ORCA PFZ Provider Interface
 * All PFZ providers must implement this interface.
 * Status is LIVE only when verified real PFZ data is returned.
 */

import { PFZProviderResult } from '../../types/alert';

export interface IPfzProvider {
  readonly id: string;
  readonly name: string;
  readonly status: 'LIVE' | 'DEMO' | 'UNAVAILABLE';

  /**
   * Returns PFZ zones for the given coordinates.
   * MUST return status='DEMO' for demonstration data.
   * MUST return status='UNAVAILABLE' if provider is not connected.
   * MUST NEVER fabricate 'LIVE' data.
   */
  getPFZZones(lat: number, lon: number): Promise<PFZProviderResult>;
}
