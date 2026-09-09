/**
 * ORCA Official Alert Provider Interface
 * All external alert providers must implement this interface.
 */

import { AlertProviderResult } from '../../types/alert';

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface IOfficialAlertProvider {
  readonly id: string;
  readonly name: string;
  readonly organization: string;
  readonly requiresCredentials: boolean;

  /**
   * Returns current alerts, optionally filtered to a bounding box.
   * Must return status UNAVAILABLE if provider is not connected.
   * Must NEVER return fabricated alerts.
   */
  getAlerts(region?: BoundingBox): Promise<AlertProviderResult>;

  /**
   * Returns true if this provider is currently operational.
   */
  isAvailable(): boolean;
}
