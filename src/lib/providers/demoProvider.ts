/**
 * DEMO Marine Provider
 * Isolated reference data provider for UI development and fallback testing.
 * All metrics explicitly return status: 'DEMO'.
 */

import { 
  IWeatherProvider, 
  IOceanProvider, 
  IPfzProvider, 
  IGeospatialProvider, 
  NearestPortResult 
} from './interfaces';
import { 
  WeatherObservation, 
  OceanObservation, 
  PFZZone, 
  GeoRestriction 
} from '../types';

export class DemoMarineProvider implements IWeatherProvider, IOceanProvider, IPfzProvider, IGeospatialProvider {
  readonly providerName = 'DEMO Marine Reference Provider';
  private readonly sourceAttribution = 'ORCA Sandbox Dataset (DEMO)';

  async getWeatherForecast(lat: number, lon: number, targetTimeIso?: string): Promise<WeatherObservation> {
    const time = targetTimeIso || new Date().toISOString();
    return {
      coordinates: { latitude: lat, longitude: lon },
      timestamp: time,
      retrievedAt: time,
      source: this.sourceAttribution,
      status: 'DEMO',
      windSpeed: {
        value: 18.5,
        unit: 'km/h',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      windGusts: {
        value: 26.0,
        unit: 'km/h',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      windDirection: {
        value: 245,
        unit: '°',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      surfacePressure: {
        value: 1011.2,
        unit: 'hPa',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      precipitation: {
        value: 0.0,
        unit: 'mm',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      weatherCode: {
        value: 1, // Mainly clear
        unit: 'WMO code',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      weatherDescription: 'Mainly clear with gentle southwest sea breeze (DEMO)',
    };
  }

  async getOceanState(lat: number, lon: number, targetTimeIso?: string): Promise<OceanObservation> {
    const time = targetTimeIso || new Date().toISOString();
    return {
      coordinates: { latitude: lat, longitude: lon },
      timestamp: time,
      retrievedAt: time,
      source: this.sourceAttribution,
      status: 'DEMO',
      waveHeight: {
        value: 1.1,
        unit: 'm',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      waveDirection: {
        value: 230,
        unit: '°',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      wavePeriod: {
        value: 6.8,
        unit: 's',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      windWaveHeight: {
        value: 0.6,
        unit: 'm',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      swellWaveHeight: {
        value: 0.9,
        unit: 'm',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      seaSurfaceTemperature: {
        value: 28.4,
        unit: '°C',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      oceanCurrentVelocity: {
        value: 0.45,
        unit: 'm/s',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
      oceanCurrentDirection: {
        value: 160,
        unit: '°',
        timestamp: time,
        source: this.sourceAttribution,
        status: 'DEMO',
      },
    };
  }

  async getNearbyPFZ(lat: number, lon: number, radiusKm = 100): Promise<PFZZone[]> {
    const now = new Date();
    const validUntil = new Date(now.getTime() + 24 * 3600 * 1000);

    return [
      {
        id: 'DEMO-PFZ-01',
        name: 'Arabian Sea Offshore Sector Alpha (DEMO)',
        coordinates: [lat + 0.15, lon + 0.2],
        polygon: [
          [lat + 0.10, lon + 0.15],
          [lat + 0.20, lon + 0.15],
          [lat + 0.20, lon + 0.25],
          [lat + 0.10, lon + 0.25],
        ],
        distanceFromLocationKm: 28.4,
        bearingDeg: 54,
        depthMeters: 45,
        sstGradient: '27.8°C - 28.6°C (0.8°C thermal front)',
        chlorophyllConcentration: '0.45 mg/m³ (Favourable)',
        validFrom: now.toISOString(),
        validTo: validUntil.toISOString(),
        source: 'INCOIS PFZ Sample Dataset (DEMO)',
        status: 'DEMO',
        advisoryType: 'DEMO_SAMPLE',
      },
    ];
  }

  async getNearestPort(lat: number, lon: number): Promise<NearestPortResult> {
    return {
      portName: 'Mumbai Port Trust (MbPT)',
      state: 'Maharashtra',
      type: 'MAJOR',
      coordinates: [18.9438, 72.8441],
      distanceKm: 14.2,
      distanceNM: 7.7,
    };
  }

  async checkRestrictions(lat: number, lon: number): Promise<GeoRestriction[]> {
    return [
      {
        id: 'DEMO-MPA-01',
        name: 'Malvan Marine Sanctuary (DEMO Boundary)',
        type: 'MPA',
        boundary: [
          [16.05, 73.45],
          [16.12, 73.45],
          [16.12, 73.55],
          [16.05, 73.55],
        ],
        description: 'Restricted Marine Ecological Zone (Ecologically Sensitive Area)',
        isProhibited: true,
        source: 'Coastal Marine Protected Areas Registry (DEMO)',
        status: 'DEMO',
      },
    ];
  }
}

export const demoMarineProvider = new DemoMarineProvider();
