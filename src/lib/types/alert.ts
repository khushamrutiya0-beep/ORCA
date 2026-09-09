/**
 * ORCA Alert Types — Milestone 5
 * Official and model-derived marine/weather alerts.
 * Strict provenance: every alert must have source, sourceType, issuedAt, status.
 */

import { DataStatus } from './marine';

// ---------------------------------------------------------------------------
// Source Type
// ---------------------------------------------------------------------------
export type SourceType =
  | 'MODEL'          // Derived from weather/ocean models
  | 'OBSERVATION'    // From a direct observation station
  | 'OFFICIAL'       // From a verified government/international source
  | 'REFERENCE'      // Static reference data
  | 'DEMO'           // Clearly labelled demonstration data
  | 'UNAVAILABLE';   // Source not connected

// ---------------------------------------------------------------------------
// Alert Severity
// ---------------------------------------------------------------------------
export type AlertSeverity = 'INFO' | 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

// Mapping from GDACS alertlevel to ORCA severity
export function gdacsLevelToSeverity(level: string): AlertSeverity {
  switch (level?.toLowerCase()) {
    case 'red': return 'SEVERE';
    case 'orange': return 'HIGH';
    case 'green': return 'MODERATE';
    default: return 'INFO';
  }
}

// ---------------------------------------------------------------------------
// Alert Type
// ---------------------------------------------------------------------------
export type AlertType =
  | 'CYCLONE'
  | 'HIGH_WIND'
  | 'HIGH_WAVES'
  | 'THUNDERSTORM'
  | 'HEAVY_RAINFALL'
  | 'ROUGH_SEA'
  | 'WEATHER_WARNING'
  | 'FISHING_ADVISORY'
  | 'PORT_WARNING'
  | 'MARITIME_ADVISORY'
  | 'FLOOD'
  | 'OTHER';

export function gdacsEventTypeToAlertType(eventType: string): AlertType {
  switch (eventType?.toUpperCase()) {
    case 'TC': return 'CYCLONE';
    case 'FL': return 'FLOOD';
    case 'EQ': return 'OTHER';
    case 'WF': return 'OTHER';
    default: return 'OTHER';
  }
}

// ---------------------------------------------------------------------------
// Normalized ORCA Alert
// ---------------------------------------------------------------------------
export interface OrcaAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;             // e.g. "GDACS — UN OCHA / EU JRC"
  sourceUrl?: string;
  sourceType: SourceType;
  issuedAt: string;           // ISO 8601
  validFrom?: string;
  validUntil?: string;
  coordinates?: { latitude: number; longitude: number };
  affectedArea?: string;      // human-readable text
  affectedCountries?: string[];
  status: DataStatus;
  retrievedAt: string;
  // GDACS-specific
  gdacsEventId?: number;
  gdacsAlertLevel?: string;
  gdacsAlertScore?: number;
  gdacsSource?: string;       // e.g. "NOAA", "JTWC"
  maxWindSpeedKmh?: number;
}

// ---------------------------------------------------------------------------
// Provider Status Record
// ---------------------------------------------------------------------------
export interface DataSourceRecord {
  id: string;
  name: string;
  organization: string;
  category: 'WEATHER' | 'MARINE' | 'ALERT' | 'PFZ' | 'GEOSPATIAL' | 'ADVISORY' | 'SATELLITE' | 'TIDE' | 'GEOFENCE' | 'ROUTING' | 'PRODUCTIVITY' | 'RISK_ENGINE';
  status: 'LIVE' | 'AVAILABLE' | 'REQUIRES_CREDENTIALS' | 'UNAVAILABLE' | 'DEMO' | 'REFERENCE' | 'PROTOTYPE_MODEL';
  accessType: 'PUBLIC_API' | 'REGISTERED_API' | 'SCRAPE' | 'MANUAL' | 'NONE' | 'PUBLIC_DATASET' | 'INTERNAL';
  endpoint?: string;
  requiresCredentials: boolean;
  isFree: boolean;
  updateFrequency?: string;
  coverage?: string;
  notes: string;
  testedAt?: string;
  testedLive?: boolean;
}

// ---------------------------------------------------------------------------
// Provider Response Wrapper
// ---------------------------------------------------------------------------
export interface AlertProviderResult {
  source: string;
  sourceType: SourceType;
  status: DataStatus;
  alerts: OrcaAlert[];
  retrievedAt: string;
  error?: string;
  fromCache?: boolean;
}

// ---------------------------------------------------------------------------
// PFZ Types (enhanced for Milestone 5)
// ---------------------------------------------------------------------------
export interface PFZProviderResult {
  source: string;
  sourceType: SourceType;
  status: DataStatus;          // Only 'LIVE' when verified real data returned
  zones: PFZZoneM5[];
  retrievedAt: string;
  disclaimer: string;
  error?: string;
}

export interface PFZZoneM5 {
  id: string;
  name: string;
  centerCoordinates: { latitude: number; longitude: number };
  polygon?: [number, number][];   // GeoJSON [lon, lat] pairs
  distanceFromQueryKm?: number;
  validFrom: string;
  validUntil: string;
  source: string;
  sourceType: SourceType;
  status: DataStatus;
  advisoryType: 'DEMO_SAMPLE' | 'LIVE_ADVISORY';
  confidence?: string;
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Command Center Types
// ---------------------------------------------------------------------------
export type RegionalRiskStatus = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'UNKNOWN';

export interface CoastalRegionStatus {
  region: string;
  state: string;
  representativeCoords: { latitude: number; longitude: number };
  riskLevel: RegionalRiskStatus;
  dataStatus: DataStatus;
  note: string;
}

export interface CommandCenterData {
  generatedAt: string;
  alertSummary: {
    severe: number;
    high: number;
    moderate: number;
    info: number;
  };
  activeAlerts: OrcaAlert[];
  coastalRegions: CoastalRegionStatus[];
  dataSourceHealth: DataSourceRecord[];
  disclaimer: string;
}
