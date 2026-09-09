/**
 * ORCA IMD Alert Provider — UNAVAILABLE STUB
 * Source: India Meteorological Department
 * Status: REQUIRES_CREDENTIALS
 *
 * IMD official alerts require account registration and API key at api.imd.gov.in
 * This provider returns UNAVAILABLE until valid credentials are configured.
 *
 * To integrate when credentials are available:
 * 1. Register at https://api.imd.gov.in/
 * 2. Set environment variable: IMD_API_KEY=your_key
 * 3. Update this provider with the correct endpoint and parsing logic
 */

import { AlertProviderResult } from '../../types/alert';
import { IOfficialAlertProvider, BoundingBox } from '../official/IOfficialAlertProvider';

export class ImdAlertProvider implements IOfficialAlertProvider {
  readonly id = 'imd-official';
  readonly name = 'IMD Official Alert Provider (India Met Dept)';
  readonly organization = 'India Meteorological Department, Government of India';
  readonly requiresCredentials = true;

  isAvailable(): boolean {
    // Returns true only when IMD credentials are configured
    const key = process.env.IMD_API_KEY;
    return !!(key && key.trim().length > 0);
  }

  async getAlerts(_region?: BoundingBox): Promise<AlertProviderResult> {
    const retrievedAt = new Date().toISOString();

    if (!this.isAvailable()) {
      return {
        source: 'India Meteorological Department (IMD) — api.imd.gov.in',
        sourceType: 'OFFICIAL',
        status: 'UNAVAILABLE',
        alerts: [],
        retrievedAt,
        error: 'IMD API credentials not configured. Set IMD_API_KEY environment variable. Register at https://api.imd.gov.in/',
      };
    }

    // TODO: When credentials are available, implement:
    // 1. Fetch from https://api.imd.gov.in/met_obs/v1/warning
    // 2. Parse CAP (Common Alerting Protocol) XML/JSON
    // 3. Normalize into OrcaAlert format
    // 4. Filter for Indian coastal regions

    return {
      source: 'India Meteorological Department (IMD)',
      sourceType: 'OFFICIAL',
      status: 'UNAVAILABLE',
      alerts: [],
      retrievedAt,
      error: 'IMD provider not yet implemented. Credentials found but integration pending.',
    };
  }
}

export const imdAlertProvider = new ImdAlertProvider();
