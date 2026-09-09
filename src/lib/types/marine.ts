/**
 * ORCA Marine Ecosystem - Core Data Contracts
 * Strict provenance and status tagging for all marine observations.
 */

export type DataStatus = 'LIVE' | 'DELAYED' | 'DEMO' | 'UNAVAILABLE';

export interface DataErrorState {
  code: 'NETWORK_ERROR' | 'PARSING_ERROR' | 'OUT_OF_BOUNDS' | 'UPSTREAM_FAILURE' | 'NOT_CONFIGURED' | 'LANDLOCKED_COORDINATES';
  message: string;
  timestamp: string;
}

export interface MarineMetric<T> {
  value: T | null;             // null if unavailable (never fake/hallucinated default)
  unit: string;               // e.g. "m", "km/h", "hPa", "°C", "knots", "°"
  timestamp: string;          // ISO 8601 observation or forecast time
  source: string;             // Exact attribution e.g. "Open-Meteo Marine (Copernicus/ECMWF)"
  status: DataStatus;         // LIVE | DELAYED | DEMO | UNAVAILABLE
  errorState?: DataErrorState | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface HourlyMarinePoint {
  time: string;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  swellWaveHeight: number | null;
  seaSurfaceTemperature: number | null;
  oceanCurrentVelocity: number | null;
  oceanCurrentDirection: number | null;
}

export interface HourlyWeatherPoint {
  time: string;
  windSpeed: number | null;
  windGusts: number | null;
  windDirection: number | null;
  surfacePressure: number | null;
  precipitation: number | null;
  weatherCode: number | null;
}

export interface OceanObservation {
  coordinates: Coordinates;
  timestamp: string;
  retrievedAt: string;
  source: string;
  status: DataStatus;
  waveHeight: MarineMetric<number>;
  waveDirection: MarineMetric<number>;
  wavePeriod: MarineMetric<number>;
  windWaveHeight: MarineMetric<number>;
  swellWaveHeight: MarineMetric<number>;
  swellWavePeriod?: MarineMetric<number>;
  seaSurfaceTemperature: MarineMetric<number>;
  oceanCurrentVelocity: MarineMetric<number>;
  oceanCurrentDirection: MarineMetric<number>;
  hourlyForecast?: HourlyMarinePoint[];
  disclaimer?: string;
  errorState?: DataErrorState | null;
}

export interface WeatherObservation {
  coordinates: Coordinates;
  timestamp: string;
  retrievedAt: string;
  source: string;
  status: DataStatus;
  windSpeed: MarineMetric<number>;
  windGusts: MarineMetric<number>;
  windDirection: MarineMetric<number>;
  surfacePressure: MarineMetric<number>;
  precipitation: MarineMetric<number>;
  weatherCode: MarineMetric<number>;
  weatherDescription?: string;
  hourlyForecast?: HourlyWeatherPoint[];
  disclaimer?: string;
  errorState?: DataErrorState | null;
}

export interface MarineAlert {
  id: string;
  title: string;
  severity: 'ADVISORY' | 'WARNING' | 'CRITICAL';
  category: 'WIND' | 'WAVE' | 'CYCLONE' | 'RESTRICTION' | 'WEATHER';
  description: string;
  issuedAt: string;
  validUntil: string;
  source: string;
  status: DataStatus;
  affectedArea?: string;
  bounds?: [number, number][];
}

export interface PFZZone {
  id: string;
  name: string;
  coordinates: [number, number];
  polygon?: [number, number][];
  distanceFromLocationKm?: number;
  bearingDeg?: number;
  depthMeters?: number;
  sstGradient?: string;
  chlorophyllConcentration?: string;
  validFrom: string;
  validTo: string;
  source: string;
  status: DataStatus;
  advisoryType: 'DEMO_SAMPLE' | 'LIVE_ADVISORY';
}

export interface GeoRestriction {
  id: string;
  name: string;
  type: 'MPA' | 'INTERNATIONAL_BORDER' | 'NAVAL_EXCLUSION' | 'SHIPPING_LANE' | 'CORAL_REEF';
  boundary: [number, number][];
  description: string;
  isProhibited: boolean;
  source: string;
  status: DataStatus;
}

export interface EvidenceItem {
  id: string;
  provider: string;
  source: string;
  timestamp: string;
  status: DataStatus;
  dataType: 'OCEAN' | 'WEATHER' | 'PFZ' | 'GEOSPATIAL' | 'ALERT';
  summary: string;
  rawMetrics: Record<string, any>;
}
