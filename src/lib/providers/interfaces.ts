import { 
  WeatherObservation, 
  OceanObservation, 
  PFZZone, 
  MarineAlert, 
  GeoRestriction 
} from '../types';

export interface IWeatherProvider {
  readonly providerName: string;
  getWeatherForecast(
    latitude: number, 
    longitude: number, 
    targetTimeIso?: string
  ): Promise<WeatherObservation>;
}

export interface IOceanProvider {
  readonly providerName: string;
  getOceanState(
    latitude: number, 
    longitude: number, 
    targetTimeIso?: string
  ): Promise<OceanObservation>;
}

export interface IPfzProvider {
  readonly providerName: string;
  getNearbyPFZ(
    latitude: number, 
    longitude: number, 
    radiusKm?: number
  ): Promise<PFZZone[]>;
}

export interface IAlertProvider {
  readonly providerName: string;
  getActiveAlerts(
    latitude: number, 
    longitude: number
  ): Promise<MarineAlert[]>;
}

export interface NearestPortResult {
  portName: string;
  state: string;
  type: 'MAJOR' | 'INTERMEDIATE' | 'MINOR';
  coordinates: [number, number]; // [lat, lon]
  distanceKm: number;
  distanceNM: number;
}

export interface IGeospatialProvider {
  readonly providerName: string;
  getNearestPort(latitude: number, longitude: number): Promise<NearestPortResult>;
  checkRestrictions(latitude: number, longitude: number): Promise<GeoRestriction[]>;
}
