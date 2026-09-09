/**
 * Open-Meteo Weather Forecast Provider
 * Integrates official, unauthenticated Open-Meteo Forecast API.
 * Endpoint: https://api.open-meteo.com/v1/forecast
 */

import { IWeatherProvider } from './interfaces';
import { WeatherObservation, MarineMetric, DataErrorState, HourlyWeatherPoint } from '../types';

export class OpenMeteoWeatherProvider implements IWeatherProvider {
  readonly providerName = 'Open-Meteo Weather Service';
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly sourceAttribution = 'Open-Meteo Forecast API (DWD / ECMWF / NOAA)';

  private mapWmoCodeToDescription(code: number | null): string {
    if (code === null || code === undefined) return 'DATA_UNAVAILABLE';
    switch (code) {
      case 0: return 'Clear Sky';
      case 1: return 'Mainly Clear';
      case 2: return 'Partly Cloudy';
      case 3: return 'Overcast';
      case 45: case 48: return 'Fog / Depositing Rime Fog';
      case 51: case 53: case 55: return 'Light to Moderate Drizzle';
      case 56: case 57: return 'Freezing Drizzle';
      case 61: case 63: return 'Slight to Moderate Rain';
      case 65: return 'Heavy Rain';
      case 66: case 67: return 'Freezing Rain';
      case 71: case 73: case 75: return 'Snow Fall';
      case 77: return 'Snow Grains';
      case 80: case 81: case 82: return 'Rain Showers';
      case 85: case 86: return 'Snow Showers';
      case 95: return 'Thunderstorm (Slight to Moderate)';
      case 96: case 99: return 'Thunderstorm with Hail';
      default: return `Weather Code ${code}`;
    }
  }

  async getWeatherForecast(
    latitude: number,
    longitude: number,
    targetTimeIso?: string
  ): Promise<WeatherObservation> {
    const retrievedAt = new Date().toISOString();

    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      const err: DataErrorState = {
        code: 'OUT_OF_BOUNDS',
        message: `Coordinates out of range: Lat ${latitude}, Lon ${longitude}. Latitude must be between -90 and 90, Longitude between -180 and 180.`,
        timestamp: retrievedAt,
      };
      return this.createUnavailableObservation(latitude, longitude, retrievedAt, err);
    }

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('latitude', latitude.toString());
      url.searchParams.set('longitude', longitude.toString());
      url.searchParams.set(
        'current',
        'wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,precipitation,weather_code'
      );
      url.searchParams.set(
        'hourly',
        'wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,precipitation,weather_code'
      );
      url.searchParams.set('timezone', 'auto');

      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'ORCA-Marine-Agent/0.1.0' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const err: DataErrorState = {
          code: 'UPSTREAM_FAILURE',
          message: `Open-Meteo HTTP ${response.status}: ${errorBody.slice(0, 150)}`,
          timestamp: retrievedAt,
        };
        return this.createUnavailableObservation(latitude, longitude, retrievedAt, err);
      }

      const data = await response.json();

      if (data.error) {
        const err: DataErrorState = {
          code: 'UPSTREAM_FAILURE',
          message: `Open-Meteo Error: ${data.reason || 'Unknown upstream error'}`,
          timestamp: retrievedAt,
        };
        return this.createUnavailableObservation(latitude, longitude, retrievedAt, err);
      }

      // Build hourly forecast points
      const hourlyList: HourlyWeatherPoint[] = [];
      const hourlyTimes: string[] = data.hourly?.time || [];
      const len = hourlyTimes.length;

      for (let i = 0; i < len; i++) {
        hourlyList.push({
          time: hourlyTimes[i],
          windSpeed: data.hourly?.wind_speed_10m?.[i] ?? null,
          windGusts: data.hourly?.wind_gusts_10m?.[i] ?? null,
          windDirection: data.hourly?.wind_direction_10m?.[i] ?? null,
          surfacePressure: data.hourly?.surface_pressure?.[i] ?? null,
          precipitation: data.hourly?.precipitation?.[i] ?? null,
          weatherCode: data.hourly?.weather_code?.[i] ?? null,
        });
      }

      // Determine the target observation point
      let targetIndex = -1;
      let observationTime = data.current?.time || retrievedAt;

      if (targetTimeIso && hourlyTimes.length > 0) {
        const targetDate = new Date(targetTimeIso).getTime();
        let minDiff = Infinity;
        hourlyTimes.forEach((tStr, idx) => {
          const diff = Math.abs(new Date(tStr).getTime() - targetDate);
          if (diff < minDiff) {
            minDiff = diff;
            targetIndex = idx;
          }
        });
        if (targetIndex >= 0) {
          observationTime = hourlyTimes[targetIndex];
        }
      }

      // Extract metrics
      const windSpeedVal = targetIndex >= 0 
        ? data.hourly?.wind_speed_10m?.[targetIndex] 
        : data.current?.wind_speed_10m;

      const windGustsVal = targetIndex >= 0 
        ? data.hourly?.wind_gusts_10m?.[targetIndex] 
        : data.current?.wind_gusts_10m;

      const windDirVal = targetIndex >= 0 
        ? data.hourly?.wind_direction_10m?.[targetIndex] 
        : data.current?.wind_direction_10m;

      const pressureVal = targetIndex >= 0 
        ? data.hourly?.surface_pressure?.[targetIndex] 
        : data.current?.surface_pressure;

      const precipVal = targetIndex >= 0 
        ? data.hourly?.precipitation?.[targetIndex] 
        : data.current?.precipitation;

      const weatherCodeVal = targetIndex >= 0 
        ? data.hourly?.weather_code?.[targetIndex] 
        : data.current?.weather_code;

      const makeMetric = <T>(val: T | undefined | null, unit: string): MarineMetric<T> => {
        const isAvailable = val !== undefined && val !== null;
        return {
          value: isAvailable ? (val as T) : null,
          unit,
          timestamp: observationTime,
          source: this.sourceAttribution,
          status: isAvailable ? 'LIVE' : 'UNAVAILABLE',
          errorState: isAvailable ? null : {
            code: 'UPSTREAM_FAILURE',
            message: 'Variable value missing in Open-Meteo response',
            timestamp: retrievedAt,
          },
        };
      };

      return {
        coordinates: { latitude, longitude },
        timestamp: observationTime,
        retrievedAt,
        source: this.sourceAttribution,
        status: 'LIVE',
        windSpeed: makeMetric<number>(windSpeedVal, 'km/h'),
        windGusts: makeMetric<number>(windGustsVal, 'km/h'),
        windDirection: makeMetric<number>(windDirVal, '°'),
        surfacePressure: makeMetric<number>(pressureVal, 'hPa'),
        precipitation: makeMetric<number>(precipVal, 'mm'),
        weatherCode: makeMetric<number>(weatherCodeVal, 'WMO code'),
        weatherDescription: this.mapWmoCodeToDescription(weatherCodeVal ?? null),
        hourlyForecast: hourlyList,
        disclaimer: 'Verified live data from Open-Meteo Weather Forecast API.',
        errorState: null,
      };
    } catch (err: any) {
      const errorState: DataErrorState = {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to connect to Open-Meteo Weather API',
        timestamp: retrievedAt,
      };
      return this.createUnavailableObservation(latitude, longitude, retrievedAt, errorState);
    }
  }

  private createUnavailableObservation(
    latitude: number,
    longitude: number,
    retrievedAt: string,
    errorState: DataErrorState
  ): WeatherObservation {
    const makeUnavailable = <T>(unit: string): MarineMetric<T> => ({
      value: null,
      unit,
      timestamp: retrievedAt,
      source: this.sourceAttribution,
      status: 'UNAVAILABLE',
      errorState,
    });

    return {
      coordinates: { latitude, longitude },
      timestamp: retrievedAt,
      retrievedAt,
      source: this.sourceAttribution,
      status: 'UNAVAILABLE',
      windSpeed: makeUnavailable<number>('km/h'),
      windGusts: makeUnavailable<number>('km/h'),
      windDirection: makeUnavailable<number>('°'),
      surfacePressure: makeUnavailable<number>('hPa'),
      precipitation: makeUnavailable<number>('mm'),
      weatherCode: makeUnavailable<number>('WMO code'),
      weatherDescription: 'DATA_UNAVAILABLE',
      hourlyForecast: [],
      errorState,
    };
  }
}

export const openMeteoWeatherProvider = new OpenMeteoWeatherProvider();
