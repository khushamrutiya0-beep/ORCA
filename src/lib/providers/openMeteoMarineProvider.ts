/**
 * Open-Meteo Marine Forecast Provider
 * Integrates official, unauthenticated Open-Meteo Marine API.
 * Endpoint: https://marine-api.open-meteo.com/v1/marine
 */

import { IOceanProvider } from './interfaces';
import { OceanObservation, MarineMetric, DataErrorState, HourlyMarinePoint } from '../types';

export class OpenMeteoMarineProvider implements IOceanProvider {
  readonly providerName = 'Open-Meteo Marine Service';
  private readonly baseUrl = 'https://marine-api.open-meteo.com/v1/marine';
  private readonly sourceAttribution = 'Open-Meteo Marine API (Copernicus / ECMWF / DWD)';
  private readonly marineDisclaimer = 
    'Notice: Open-Meteo Marine model provides ocean state estimates at ~8km resolution. Wave and current values in shallow nearshore zones are model-based and not a certified substitute for official navigational warnings.';

  async getOceanState(
    latitude: number,
    longitude: number,
    targetTimeIso?: string
  ): Promise<OceanObservation> {
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
        'hourly',
        'wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_period,sea_surface_temperature,ocean_current_velocity,ocean_current_direction'
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
          message: `Open-Meteo Marine HTTP ${response.status}: ${errorBody.slice(0, 150)}`,
          timestamp: retrievedAt,
        };
        return this.createUnavailableObservation(latitude, longitude, retrievedAt, err);
      }

      const data = await response.json();

      if (data.error) {
        const err: DataErrorState = {
          code: 'UPSTREAM_FAILURE',
          message: `Open-Meteo Marine Error: ${data.reason || 'Unknown upstream error'}`,
          timestamp: retrievedAt,
        };
        return this.createUnavailableObservation(latitude, longitude, retrievedAt, err);
      }

      const hourlyTimes: string[] = data.hourly?.time || [];
      const waveHeights: (number | null)[] = data.hourly?.wave_height || [];

      // Check if coordinates are landlocked (all wave heights are null)
      const hasAnyWaveData = waveHeights.some((v) => v !== null && v !== undefined);
      if (!hasAnyWaveData && waveHeights.length > 0) {
        const err: DataErrorState = {
          code: 'LANDLOCKED_COORDINATES',
          message: `No marine model grid point found for coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Selected point is terrestrial/inland.`,
          timestamp: retrievedAt,
        };
        return this.createUnavailableObservation(latitude, longitude, retrievedAt, err);
      }

      // Build hourly forecast points
      const hourlyList: HourlyMarinePoint[] = [];
      const len = hourlyTimes.length;

      for (let i = 0; i < len; i++) {
        hourlyList.push({
          time: hourlyTimes[i],
          waveHeight: data.hourly?.wave_height?.[i] ?? null,
          wavePeriod: data.hourly?.wave_period?.[i] ?? null,
          waveDirection: data.hourly?.wave_direction?.[i] ?? null,
          swellWaveHeight: data.hourly?.swell_wave_height?.[i] ?? null,
          seaSurfaceTemperature: data.hourly?.sea_surface_temperature?.[i] ?? null,
          oceanCurrentVelocity: data.hourly?.ocean_current_velocity?.[i] ?? null,
          oceanCurrentDirection: data.hourly?.ocean_current_direction?.[i] ?? null,
        });
      }

      // Determine the target observation point
      let targetIndex = 0; // default to first available hour
      let observationTime = hourlyTimes[0] || retrievedAt;

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
        observationTime = hourlyTimes[targetIndex];
      } else if (hourlyTimes.length > 0) {
        // Find current or nearest hour in forecast list
        const nowMs = Date.now();
        let minDiff = Infinity;
        hourlyTimes.forEach((tStr, idx) => {
          const diff = Math.abs(new Date(tStr).getTime() - nowMs);
          if (diff < minDiff) {
            minDiff = diff;
            targetIndex = idx;
          }
        });
        observationTime = hourlyTimes[targetIndex];
      }

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
            message: 'Variable value missing in Open-Meteo Marine response',
            timestamp: retrievedAt,
          },
        };
      };

      const waveHeightVal = data.hourly?.wave_height?.[targetIndex];
      const waveDirVal = data.hourly?.wave_direction?.[targetIndex];
      const wavePeriodVal = data.hourly?.wave_period?.[targetIndex];
      const windWaveHeightVal = data.hourly?.wind_wave_height?.[targetIndex];
      const swellWaveHeightVal = data.hourly?.swell_wave_height?.[targetIndex];
      const swellWavePeriodVal = data.hourly?.swell_wave_period?.[targetIndex];
      const sstVal = data.hourly?.sea_surface_temperature?.[targetIndex];
      const currentVelVal = data.hourly?.ocean_current_velocity?.[targetIndex];
      const currentDirVal = data.hourly?.ocean_current_direction?.[targetIndex];

      return {
        coordinates: { latitude, longitude },
        timestamp: observationTime,
        retrievedAt,
        source: this.sourceAttribution,
        status: 'LIVE',
        waveHeight: makeMetric<number>(waveHeightVal, 'm'),
        waveDirection: makeMetric<number>(waveDirVal, '°'),
        wavePeriod: makeMetric<number>(wavePeriodVal, 's'),
        windWaveHeight: makeMetric<number>(windWaveHeightVal, 'm'),
        swellWaveHeight: makeMetric<number>(swellWaveHeightVal, 'm'),
        swellWavePeriod: makeMetric<number>(swellWavePeriodVal, 's'),
        seaSurfaceTemperature: makeMetric<number>(sstVal, '°C'),
        oceanCurrentVelocity: makeMetric<number>(currentVelVal, 'm/s'),
        oceanCurrentDirection: makeMetric<number>(currentDirVal, '°'),
        hourlyForecast: hourlyList,
        disclaimer: this.marineDisclaimer,
        errorState: null,
      };
    } catch (err: any) {
      const errorState: DataErrorState = {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to connect to Open-Meteo Marine API',
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
  ): OceanObservation {
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
      waveHeight: makeUnavailable<number>('m'),
      waveDirection: makeUnavailable<number>('°'),
      wavePeriod: makeUnavailable<number>('s'),
      windWaveHeight: makeUnavailable<number>('m'),
      swellWaveHeight: makeUnavailable<number>('m'),
      swellWavePeriod: makeUnavailable<number>('s'),
      seaSurfaceTemperature: makeUnavailable<number>('°C'),
      oceanCurrentVelocity: makeUnavailable<number>('m/s'),
      oceanCurrentDirection: makeUnavailable<number>('°'),
      hourlyForecast: [],
      disclaimer: this.marineDisclaimer,
      errorState,
    };
  }
}

export const openMeteoMarineProvider = new OpenMeteoMarineProvider();
