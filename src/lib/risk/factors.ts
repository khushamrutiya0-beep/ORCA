/**
 * ORCA Deterministic Risk Factor Evaluators
 * Transparently computes risk contributions from individual marine and atmospheric observations.
 */

import { MarineMetric, RiskFactorResult, RiskLevel } from '../types';
import { RISK_THRESHOLDS } from './thresholds';

export function evaluateWaveHeightFactor(waveMetric?: MarineMetric<number> | null): RiskFactorResult {
  const factor = 'WAVE_HEIGHT';
  const label = 'Significant Wave Height';
  const unit = 'm';
  const weight = RISK_THRESHOLDS.weights.waveHeight;
  const source = waveMetric?.source || 'Open-Meteo Marine API';
  const timestamp = waveMetric?.timestamp || new Date().toISOString();

  if (!waveMetric || waveMetric.status === 'UNAVAILABLE' || waveMetric.value === null || waveMetric.value === undefined) {
    return {
      factor,
      label,
      value: null,
      unit,
      level: 'UNKNOWN',
      score: 50,
      weight,
      reason: 'Wave height observation is unavailable for the selected coordinates.',
      source,
      timestamp,
    };
  }

  const h = waveMetric.value;
  let level: RiskLevel = 'LOW';
  let score = 0;
  let reason = '';

  const { lowMax, moderateMax, highMax } = RISK_THRESHOLDS.waveHeight;

  if (h < lowMax) {
    level = 'LOW';
    score = Math.round((h / lowMax) * 25);
    reason = `Wave height is ${h.toFixed(2)}m (Calm to Slight sea state). Low prototype risk contribution from wave height based on available model data.`;
  } else if (h <= moderateMax) {
    level = 'MODERATE';
    score = 25 + Math.round(((h - lowMax) / (moderateMax - lowMax)) * 35);
    reason = `Wave height is ${h.toFixed(2)}m (Moderate sea state). Caution advised for small non-motorized craft.`;
  } else if (h <= highMax) {
    level = 'HIGH';
    score = 60 + Math.round(((h - moderateMax) / (highMax - moderateMax)) * 25);
    reason = `Wave height is ${h.toFixed(2)}m (Rough sea state). Hazardous conditions for traditional and small fishing boats.`;
  } else {
    level = 'SEVERE';
    score = Math.min(100, 85 + Math.round(((h - highMax) / 2.0) * 15));
    reason = `Wave height is ${h.toFixed(2)}m (Very Rough to High sea state). Severe marine hazard for all vessels.`;
  }

  return { factor, label, value: h, unit, level, score, weight, reason, source, timestamp };
}

export function evaluateWindSpeedFactor(windMetric?: MarineMetric<number> | null): RiskFactorResult {
  const factor = 'WIND_SPEED';
  const label = 'Sustained Wind Speed';
  const unit = 'km/h';
  const weight = RISK_THRESHOLDS.weights.windSpeed;
  const source = windMetric?.source || 'Open-Meteo Forecast API';
  const timestamp = windMetric?.timestamp || new Date().toISOString();

  if (!windMetric || windMetric.status === 'UNAVAILABLE' || windMetric.value === null || windMetric.value === undefined) {
    return {
      factor,
      label,
      value: null,
      unit,
      level: 'UNKNOWN',
      score: 50,
      weight,
      reason: 'Wind speed observation is unavailable for the selected coordinates.',
      source,
      timestamp,
    };
  }

  const w = windMetric.value;
  let level: RiskLevel = 'LOW';
  let score = 0;
  let reason = '';

  const { lowMax, moderateMax, highMax } = RISK_THRESHOLDS.windSpeed;

  if (w < lowMax) {
    level = 'LOW';
    score = Math.round((w / lowMax) * 25);
    reason = `Wind speed is ${w.toFixed(1)} km/h (Light to Gentle breeze). Low prototype risk contribution from wind speed based on available model data.`;
  } else if (w <= moderateMax) {
    level = 'MODERATE';
    score = 25 + Math.round(((w - lowMax) / (moderateMax - lowMax)) * 35);
    reason = `Wind speed is ${w.toFixed(1)} km/h (Moderate to Fresh breeze). Manageable for motorized craft.`;
  } else if (w <= highMax) {
    level = 'HIGH';
    score = 60 + Math.round(((w - moderateMax) / (highMax - moderateMax)) * 25);
    reason = `Wind speed is ${w.toFixed(1)} km/h (Strong breeze to Near Gale). High wind hazard advisory.`;
  } else {
    level = 'SEVERE';
    score = Math.min(100, 85 + Math.round(((w - highMax) / 25.0) * 15));
    reason = `Wind speed is ${w.toFixed(1)} km/h (Gale / Storm force winds). Extreme danger for open sea ventures.`;
  }

  return { factor, label, value: w, unit, level, score, weight, reason, source, timestamp };
}

export function evaluateWindGustFactor(gustMetric?: MarineMetric<number> | null): RiskFactorResult {
  const factor = 'WIND_GUST';
  const label = 'Peak Wind Gusts';
  const unit = 'km/h';
  const weight = RISK_THRESHOLDS.weights.windGusts;
  const source = gustMetric?.source || 'Open-Meteo Forecast API';
  const timestamp = gustMetric?.timestamp || new Date().toISOString();

  if (!gustMetric || gustMetric.status === 'UNAVAILABLE' || gustMetric.value === null || gustMetric.value === undefined) {
    return {
      factor,
      label,
      value: null,
      unit,
      level: 'UNKNOWN',
      score: 50,
      weight,
      reason: 'Wind gust observation is unavailable.',
      source,
      timestamp,
    };
  }

  const g = gustMetric.value;
  let level: RiskLevel = 'LOW';
  let score = 0;
  let reason = '';

  const { lowMax, moderateMax, highMax } = RISK_THRESHOLDS.windGusts;

  if (g < lowMax) {
    level = 'LOW';
    score = Math.round((g / lowMax) * 25);
    reason = `Peak gusts are ${g.toFixed(1)} km/h. No significant squall risk.`;
  } else if (g <= moderateMax) {
    level = 'MODERATE';
    score = 25 + Math.round(((g - lowMax) / (moderateMax - lowMax)) * 35);
    reason = `Peak gusts are ${g.toFixed(1)} km/h. Occasional sudden wind surges possible.`;
  } else if (g <= highMax) {
    level = 'HIGH';
    score = 60 + Math.round(((g - moderateMax) / (highMax - moderateMax)) * 25);
    reason = `Peak gusts reach ${g.toFixed(1)} km/h. Strong squally gusts present sudden capsize risk.`;
  } else {
    level = 'SEVERE';
    score = Math.min(100, 85 + Math.round(((g - highMax) / 30.0) * 15));
    reason = `Severe peak gusts reaching ${g.toFixed(1)} km/h. High risk of vessel destabilization.`;
  }

  return { factor, label, value: g, unit, level, score, weight, reason, source, timestamp };
}

export function evaluateWeatherConditionFactor(
  codeMetric?: MarineMetric<number> | null,
  weatherDesc?: string
): RiskFactorResult {
  const factor = 'WEATHER_CONDITION';
  const label = 'Atmospheric & Squall Activity';
  const unit = 'WMO code';
  const weight = RISK_THRESHOLDS.weights.weatherCondition;
  const source = codeMetric?.source || 'Open-Meteo Forecast API';
  const timestamp = codeMetric?.timestamp || new Date().toISOString();

  if (!codeMetric || codeMetric.status === 'UNAVAILABLE' || codeMetric.value === null || codeMetric.value === undefined) {
    return {
      factor,
      label,
      value: null,
      unit,
      level: 'UNKNOWN',
      score: 50,
      weight,
      reason: 'Weather condition code is unavailable.',
      source,
      timestamp,
    };
  }

  const code = codeMetric.value;
  let level: RiskLevel = 'LOW';
  let score = 10;
  let reason = weatherDesc || `Weather code ${code}`;

  if (RISK_THRESHOLDS.severeWeatherCodes.includes(code)) {
    level = 'SEVERE';
    score = 95;
    reason = `Thunderstorm / Squall activity detected (${weatherDesc || 'WMO code ' + code}). High lightning and sudden surge hazard.`;
  } else if (RISK_THRESHOLDS.moderateWeatherCodes.includes(code)) {
    level = 'MODERATE';
    score = 45;
    reason = `Rain showers or reduced visibility (${weatherDesc || 'WMO code ' + code}).`;
  } else {
    level = 'LOW';
    score = 10;
    reason = `Clear or stable atmospheric conditions (${weatherDesc || 'WMO code ' + code}).`;
  }

  return { factor, label, value: code, unit, level, score, weight, reason, source, timestamp };
}

export function evaluateOceanCurrentFactor(currentMetric?: MarineMetric<number> | null): RiskFactorResult {
  const factor = 'OCEAN_CURRENT';
  const label = 'Ocean Surface Current Velocity';
  const unit = 'm/s';
  const weight = RISK_THRESHOLDS.weights.oceanCurrent;
  const source = currentMetric?.source || 'Open-Meteo Marine API';
  const timestamp = currentMetric?.timestamp || new Date().toISOString();

  if (!currentMetric || currentMetric.status === 'UNAVAILABLE' || currentMetric.value === null || currentMetric.value === undefined) {
    return {
      factor,
      label,
      value: null,
      unit,
      level: 'UNKNOWN',
      score: 30,
      weight,
      reason: 'Ocean surface current velocity is unavailable for this grid cell.',
      source,
      timestamp,
    };
  }

  const c = currentMetric.value;
  let level: RiskLevel = 'LOW';
  let score = 0;
  let reason = '';

  const { lowMax, moderateMax, highMax } = RISK_THRESHOLDS.oceanCurrent;

  if (c < lowMax) {
    level = 'LOW';
    score = Math.round((c / lowMax) * 25);
    reason = `Surface current is ${c.toFixed(2)} m/s (~${(c * 1.944).toFixed(1)} kts). Mild drift.`;
  } else if (c <= moderateMax) {
    level = 'MODERATE';
    score = 25 + Math.round(((c - lowMax) / (moderateMax - lowMax)) * 35);
    reason = `Surface current is ${c.toFixed(2)} m/s (~${(c * 1.944).toFixed(1)} kts). Noticeable net drift; small craft maneuvering caution.`;
  } else if (c <= highMax) {
    level = 'HIGH';
    score = 60 + Math.round(((c - moderateMax) / (highMax - moderateMax)) * 25);
    reason = `Strong surface current at ${c.toFixed(2)} m/s (~${(c * 1.944).toFixed(1)} kts). High drift challenge for fishing gear.`;
  } else {
    level = 'SEVERE';
    score = 90;
    reason = `Severe current stream exceeding ${c.toFixed(2)} m/s. Dangerous drift and navigation hazard.`;
  }

  return { factor, label, value: c, unit, level, score, weight, reason, source, timestamp };
}
