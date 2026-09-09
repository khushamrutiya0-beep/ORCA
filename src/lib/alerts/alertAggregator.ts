/**
 * ORCA Alert Aggregator
 * Queries all configured alert providers, merges and deduplicates results.
 * Providers: GDACS (LIVE), IMD (UNAVAILABLE until credentials added)
 * Never fabricates alerts — if provider is unavailable, status is reported honestly.
 */

import { OrcaAlert, AlertProviderResult } from '../types/alert';
import { gdacsCycloneProvider } from '../providers/gdacs/gdacsCycloneProvider';
import { imdAlertProvider } from '../providers/gdacs/imdAlertProvider';
import { IOfficialAlertProvider } from '../providers/official/IOfficialAlertProvider';

export interface AggregatedAlertResult {
  alerts: OrcaAlert[];
  providerResults: AlertProviderResult[];
  retrievedAt: string;
  liveProviders: string[];
  unavailableProviders: string[];
}

// All registered alert providers — order determines priority
const ALERT_PROVIDERS: IOfficialAlertProvider[] = [
  gdacsCycloneProvider,
  imdAlertProvider,
];

/**
 * Fetch alerts from all providers, filtered by proximity to coordinates.
 * @param lat Query latitude
 * @param lon Query longitude
 * @param radiusKm Search radius in km (default 2000 km — covers Indian Ocean region)
 */
export async function getAggregatedAlerts(
  lat: number,
  lon: number,
  radiusKm = 2000
): Promise<AggregatedAlertResult> {
  const retrievedAt = new Date().toISOString();
  const providerResults: AlertProviderResult[] = [];
  const liveProviders: string[] = [];
  const unavailableProviders: string[] = [];
  const allAlerts: OrcaAlert[] = [];
  const seenIds = new Set<string>();

  await Promise.all(
    ALERT_PROVIDERS.map(async (provider) => {
      try {
        const result = await provider.getAlerts();
        providerResults.push(result);

        if (result.status === 'LIVE' || result.status === 'DELAYED') {
          liveProviders.push(provider.name);
          // Filter by proximity
          const filtered = result.alerts.filter((alert: OrcaAlert) => {
            if (!alert.coordinates) return true; // no coords = regional alert
            const dist = haversineKm(lat, lon, alert.coordinates.latitude, alert.coordinates.longitude);
            return dist <= radiusKm;
          });
          for (const alert of filtered) {
            if (!seenIds.has(alert.id)) {
              seenIds.add(alert.id);
              allAlerts.push(alert);
            }
          }
        } else {
          unavailableProviders.push(provider.name);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        unavailableProviders.push(provider.name);
        providerResults.push({
          source: provider.name,
          sourceType: 'OFFICIAL',
          status: 'UNAVAILABLE',
          alerts: [],
          retrievedAt,
          error: message,
        });
      }
    })
  );

  // Sort by severity
  const severityOrder: Record<string, number> = { SEVERE: 0, HIGH: 1, MODERATE: 2, LOW: 3, INFO: 4 };
  allAlerts.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

  return { alerts: allAlerts, providerResults, retrievedAt, liveProviders, unavailableProviders };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
