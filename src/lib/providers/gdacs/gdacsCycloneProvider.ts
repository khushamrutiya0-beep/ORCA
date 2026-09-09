/**
 * ORCA GDACS Cyclone / Disaster Alert Provider
 * Source: GDACS — Global Disaster Alert and Coordination System
 * Organization: UN OCHA / EU Joint Research Centre (JRC)
 * Access: Public API, no authentication required
 * Endpoint: https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH
 *
 * LIVE-TESTED: 2026-08-24 ✅
 *
 * Filters events to Indian maritime zone:
 *   Latitude:  5°N – 30°N
 *   Longitude: 55°E – 100°E
 *   (covers Arabian Sea, Indian Ocean, Bay of Bengal)
 *
 * Returns TC (Tropical Cyclone) and FL (Flood) events relevant to Indian coast.
 * Normalizes into ORCA OrcaAlert format with full provenance.
 *
 * Server-side only — never called from the browser.
 */

import {
  OrcaAlert,
  AlertProviderResult,
  gdacsLevelToSeverity,
  gdacsEventTypeToAlertType,
} from '../../types/alert';
import { IOfficialAlertProvider, BoundingBox } from '../official/IOfficialAlertProvider';

// Indian maritime zone bounding box
const INDIAN_MARITIME_ZONE: BoundingBox = {
  minLat: 5,
  maxLat: 30,
  minLon: 55,
  maxLon: 100,
};

const GDACS_API_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';
const GDACS_REPORT_BASE = 'https://www.gdacs.org/report.aspx';
const REQUEST_TIMEOUT_MS = 10000;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Simple in-memory cache (server-side module singleton)
let _cache: { data: AlertProviderResult; fetchedAt: number } | null = null;

// GDACS GeoJSON feature type
interface GdacsFeatureProperties {
  eventtype: string;
  eventid: number;
  episodeid: number;
  eventname: string;
  name: string;
  description: string;
  alertlevel: string;
  alertscore: number;
  country: string;
  fromdate: string;
  todate: string;
  datemodified: string;
  iso3: string;
  source: string;
  affectedcountries?: { iso2: string; iso3: string; countryname: string }[];
  severitydata: { severity: number; severitytext: string; severityunit: string };
  url: { report: string; geometry: string; details: string };
}

interface GdacsFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: [number, number] };
  bbox?: [number, number, number, number];
  properties: GdacsFeatureProperties;
}

interface GdacsFeatureCollection {
  type: 'FeatureCollection';
  features: GdacsFeature[];
}

function isInIndianMaritime(lat: number, lon: number, zone: BoundingBox): boolean {
  return lat >= zone.minLat && lat <= zone.maxLat &&
    lon >= zone.minLon && lon <= zone.maxLon;
}

function normalizeGdacsFeature(feature: GdacsFeature, retrievedAt: string): OrcaAlert | null {
  const props = feature.properties;
  const coords = feature.geometry?.coordinates; // [lon, lat]

  // Only include TC (cyclone) and relevant FL (flood affecting coastal India)
  const relevantTypes = ['TC', 'FL'];
  if (!relevantTypes.includes(props.eventtype)) return null;

  // Only include if event type provides ocean/marine value
  const lon = coords?.[0];
  const lat = coords?.[1];

  const affectedCountries = props.affectedcountries?.map(c => c.countryname) ?? [];
  const isIndiaAffected = affectedCountries.includes('India') ||
    props.country?.includes('India') ||
    props.iso3 === 'IND';
  const isInRegion = lat !== undefined && lon !== undefined &&
    isInIndianMaritime(lat, lon, INDIAN_MARITIME_ZONE);

  // Include if event is in Indian maritime zone or explicitly affects India
  if (!isInRegion && !isIndiaAffected) return null;

  const alertType = gdacsEventTypeToAlertType(props.eventtype);
  const severity = gdacsLevelToSeverity(props.alertlevel);

  const windSpeed = props.severitydata?.severityunit?.toLowerCase() === 'km/h'
    ? props.severitydata.severity
    : undefined;

  return {
    id: `gdacs-${props.eventtype}-${props.eventid}-${props.episodeid}`,
    type: alertType,
    severity,
    title: props.eventname ? `${props.eventname} — ${props.name}` : props.name,
    description: props.description +
      (props.severitydata?.severitytext ? `. ${props.severitydata.severitytext}` : ''),
    source: 'GDACS — UN OCHA / EU Joint Research Centre (JRC)',
    sourceUrl: props.url?.report ?? `${GDACS_REPORT_BASE}?eventid=${props.eventid}&eventtype=${props.eventtype}`,
    sourceType: 'OFFICIAL',
    issuedAt: props.fromdate,
    validUntil: props.todate,
    coordinates: lat !== undefined && lon !== undefined
      ? { latitude: lat, longitude: lon }
      : undefined,
    affectedArea: props.country || undefined,
    affectedCountries: affectedCountries.length > 0 ? affectedCountries : undefined,
    status: 'LIVE',
    retrievedAt,
    gdacsEventId: props.eventid,
    gdacsAlertLevel: props.alertlevel,
    gdacsAlertScore: props.alertscore,
    gdacsSource: props.source,
    maxWindSpeedKmh: windSpeed,
  };
}

export class GdacsCycloneProvider implements IOfficialAlertProvider {
  readonly id = 'gdacs-alerts';
  readonly name = 'GDACS Alert Provider';
  readonly organization = 'UN OCHA / EU JRC';
  readonly requiresCredentials = false;

  isAvailable(): boolean { return true; }

  async getAlerts(region: BoundingBox = INDIAN_MARITIME_ZONE): Promise<AlertProviderResult> {
    const retrievedAt = new Date().toISOString();

    // Return cached data if fresh
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_DURATION_MS) {
      return { ..._cache.data, fromCache: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      // Fetch all TC (tropical cyclone) and FL (flood) events — no auth needed
      const url = new URL(GDACS_API_URL);
      url.searchParams.set('eventtype', 'TC,FL');
      url.searchParams.set('alertlevel', 'Green,Orange,Red');
      url.searchParams.set('limit', '50');

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ORCA-Marine-Intelligence/1.0 (prototype research system)',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GDACS API returned HTTP ${response.status}`);
      }

      const geojson: GdacsFeatureCollection = await response.json();

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        throw new Error('GDACS API returned unexpected response shape');
      }

      const alerts: OrcaAlert[] = [];
      for (const feature of geojson.features) {
        const alert = normalizeGdacsFeature(feature, retrievedAt);
        if (alert) alerts.push(alert);
      }

      // Sort by severity (SEVERE first)
      const severityOrder: Record<string, number> = { SEVERE: 0, HIGH: 1, MODERATE: 2, LOW: 3, INFO: 4 };
      alerts.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

      const result: AlertProviderResult = {
        source: 'GDACS — UN OCHA / EU Joint Research Centre (JRC)',
        sourceType: 'OFFICIAL',
        status: 'LIVE',
        alerts,
        retrievedAt,
        fromCache: false,
      };

      _cache = { data: result, fetchedAt: Date.now() };
      return result;

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[GdacsCycloneProvider] Fetch error:', message);

      // Return stale cache if available
      if (_cache) {
        return {
          ..._cache.data,
          status: 'DELAYED',
          fromCache: true,
          error: `GDACS fetch failed (using cached data): ${message}`,
        };
      }

      return {
        source: 'GDACS — UN OCHA / EU Joint Research Centre (JRC)',
        sourceType: 'OFFICIAL',
        status: 'UNAVAILABLE',
        alerts: [],
        retrievedAt,
        error: `GDACS provider error: ${message}`,
        fromCache: false,
      };
    }
  }

  /**
   * Filter alerts to those within a given radius of coordinates.
   */
  filterByProximity(
    alerts: OrcaAlert[],
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): OrcaAlert[] {
    return alerts.filter(alert => {
      if (!alert.coordinates) return true; // include if no coords (affect whole region)
      const dist = haversineKm(
        centerLat, centerLon,
        alert.coordinates.latitude, alert.coordinates.longitude
      );
      return dist <= radiusKm;
    });
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Singleton
export const gdacsCycloneProvider = new GdacsCycloneProvider();
