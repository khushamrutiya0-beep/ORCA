/**
 * ORCA Deterministic Marine Risk Engine
 * Prototype decision-support model based on documented meteorological/ocean criteria.
 * Zero LLM hallucination - 100% pure TypeScript computation.
 */

import { 
  Coordinates, 
  OceanObservation, 
  WeatherObservation, 
  RiskAssessment, 
  RiskLevel, 
  RiskFactorResult, 
  EvidenceItem, 
  NearestPortInfo 
} from '../types';
import { ORCA_PROTOTYPE_DISCLAIMER, RISK_THRESHOLDS } from './thresholds';
import { 
  evaluateWaveHeightFactor, 
  evaluateWindSpeedFactor, 
  evaluateWindGustFactor, 
  evaluateWeatherConditionFactor, 
  evaluateOceanCurrentFactor 
} from './factors';
import { formatTimeWindowLabel } from './timeWindows';

export interface RiskEvaluationParams {
  coordinates: Coordinates;
  targetTimeIso?: string;
  timeLabel?: string;
  weatherObservation?: WeatherObservation | null;
  oceanObservation?: OceanObservation | null;
  nearestPort?: NearestPortInfo;
}

export class ORCARiskEngine {
  readonly version = 'ORCA-RiskEngine-v0.3.0';

  assessMarineRisk(params: RiskEvaluationParams): RiskAssessment {
    const {
      coordinates,
      targetTimeIso,
      timeLabel = formatTimeWindowLabel(targetTimeIso),
      weatherObservation,
      oceanObservation,
      nearestPort,
    } = params;

    const generatedAt = new Date().toISOString();
    const factors: RiskFactorResult[] = [];
    const warnings: string[] = [];
    const missingDataReasons: string[] = [];

    // Evaluate individual factors
    const waveFactor = evaluateWaveHeightFactor(oceanObservation?.waveHeight);
    factors.push(waveFactor);

    const windFactor = evaluateWindSpeedFactor(weatherObservation?.windSpeed);
    factors.push(windFactor);

    const gustFactor = evaluateWindGustFactor(weatherObservation?.windGusts);
    factors.push(gustFactor);

    const weatherFactor = evaluateWeatherConditionFactor(
      weatherObservation?.weatherCode,
      weatherObservation?.weatherDescription
    );
    factors.push(weatherFactor);

    const currentFactor = evaluateOceanCurrentFactor(oceanObservation?.oceanCurrentVelocity);
    factors.push(currentFactor);

    // Check for critical missing data
    const isWaveMissing = waveFactor.level === 'UNKNOWN';
    const isWindMissing = windFactor.level === 'UNKNOWN';

    if (isWaveMissing) {
      missingDataReasons.push('Wave height observation is missing or out-of-bounds (terrestrial coordinate).');
    }
    if (isWindMissing) {
      missingDataReasons.push('Atmospheric wind speed observation is missing.');
    }

    const criticalDataMissing = isWaveMissing && isWindMissing;

    // If both primary marine & atmospheric metrics are missing, return UNKNOWN
    if (criticalDataMissing) {
      return {
        riskLevel: 'UNKNOWN',
        riskScore: 0,
        safetyScore: 0,
        targetTime: targetTimeIso || generatedAt,
        timeLabel,
        generatedAt,
        dataFreshness: 'DATA_UNAVAILABLE',
        coordinates,
        nearestPort,
        summary: 'Critical marine and meteorological telemetry is unavailable for these coordinates.',
        recommendation: 'Unable to produce a prototype risk assessment. Verify current conditions via local port authority and coast guard bulletins before any sea venture.',
        warnings: ['INSUFFICIENT TELEMETRY: Both ocean wave and wind models returned no valid data.'],
        factors,
        criticalDataMissing: true,
        missingDataReasons,
        vesselAdvisory: {
          smallCraftCaution: true,
          motorizedCraftCaution: true,
          deepSeaVesselCaution: true,
          guidance: 'Insufficient model data to produce a prototype risk signal. Maintain port standby and consult official port bulletins.',
        },
        evidence: this.compileEvidence(weatherObservation, oceanObservation),
        disclaimer: ORCA_PROTOTYPE_DISCLAIMER,
      };
    }

    // Calculate weighted composite risk score from available factors
    let totalWeightedScore = 0;
    let totalAvailableWeight = 0;

    factors.forEach((f) => {
      if (f.level !== 'UNKNOWN') {
        totalWeightedScore += f.score * f.weight;
        totalAvailableWeight += f.weight;
      }
    });

    let compositeScore = totalAvailableWeight > 0 
      ? Math.round(totalWeightedScore / totalAvailableWeight) 
      : 50;

    // Ceiling & Override Rules:
    // 1. Any SEVERE factor elevates composite risk to SEVERE
    const hasSevereFactor = factors.some((f) => f.level === 'SEVERE');
    const hasHighFactor = factors.some((f) => f.level === 'HIGH');

    if (hasSevereFactor) {
      compositeScore = Math.max(compositeScore, 85);
    } else if (hasHighFactor) {
      compositeScore = Math.max(compositeScore, 65);
    }

    // Map composite score to Risk Level
    let riskLevel: RiskLevel = 'LOW';
    if (compositeScore < 30) {
      riskLevel = 'LOW';
    } else if (compositeScore <= 60) {
      riskLevel = 'MODERATE';
    } else if (compositeScore <= 85) {
      riskLevel = 'HIGH';
    } else {
      riskLevel = 'SEVERE';
    }

    const safetyScore = Math.max(0, 100 - compositeScore);

    // Compile warnings
    factors.forEach((f) => {
      if (f.level === 'SEVERE' || f.level === 'HIGH') {
        warnings.push(`${f.label}: ${f.reason}`);
      }
    });

    if (nearestPort && nearestPort.distanceNM > 20) {
      warnings.push(`Nearest shelter port (${nearestPort.portName}) is ${nearestPort.distanceNM} NM away. This prototype model does not guarantee navigational safety of the route.`);
    }

    // Build structured recommendation
    let summary = '';
    let recommendation = '';

    if (riskLevel === 'LOW') {
      summary = `Conditions for ${timeLabel} at (${coordinates.latitude.toFixed(2)}°N, ${coordinates.longitude.toFixed(2)}°E) are evaluated as LOW RISK (Score: ${compositeScore}/100).`;
      recommendation = 'Conditions are assessed as LOW by the ORCA prototype model based on available forecast telemetry. Always verify with official port authority and coast guard bulletins before departure.';
    } else if (riskLevel === 'MODERATE') {
      summary = `Conditions for ${timeLabel} at (${coordinates.latitude.toFixed(2)}°N, ${coordinates.longitude.toFixed(2)}°E) are evaluated as MODERATE RISK (Score: ${compositeScore}/100).`;
      recommendation = 'Caution advised for small non-motorized boats and traditional crafts due to moderate waves/wind. Motorized crafts may operate with standard vigilance.';
    } else if (riskLevel === 'HIGH') {
      summary = `Conditions for ${timeLabel} at (${coordinates.latitude.toFixed(2)}°N, ${coordinates.longitude.toFixed(2)}°E) are evaluated as HIGH RISK (Score: ${compositeScore}/100).`;
      recommendation = 'Hazardous sea conditions. Small fishing boats are advised NOT to venture into open waters. Maintain proximity to coastal shelter.';
    } else {
      summary = `Conditions for ${timeLabel} at (${coordinates.latitude.toFixed(2)}°N, ${coordinates.longitude.toFixed(2)}°E) are evaluated as SEVERE HAZARD (Score: ${compositeScore}/100).`;
      recommendation = 'DANGEROUS SEA CONDITIONS. All vessels are strongly advised against sea ventures. High waves/severe winds present severe capsize hazard.';
    }

    // Vessel specific guidance
    const waveVal = oceanObservation?.waveHeight?.value ?? 0;
    const windVal = weatherObservation?.windSpeed?.value ?? 0;
    const gustVal = weatherObservation?.windGusts?.value ?? 0;

    const smallCraftCaution = compositeScore >= 30 || waveVal > 1.25 || windVal > 22;
    const motorizedCraftCaution = compositeScore >= 60 || waveVal > 2.0 || windVal > 38;
    const deepSeaVesselCaution = compositeScore >= 80 || waveVal > 3.5 || gustVal > 60;

    const vesselGuidance = 
      riskLevel === 'LOW'
        ? 'No elevated prototype risk signal detected for this vessel category based on available model data.'
        : riskLevel === 'MODERATE'
        ? 'Small unmotorized craft should remain nearshore. Mechanized boats proceed with caution.'
        : riskLevel === 'HIGH'
        ? 'Small and medium fishing vessels should stay in port. Deep sea trawlers exercise extreme caution.'
        : 'All vessel operations should be suspended until weather and sea state subside.';

    return {
      riskLevel,
      riskScore: compositeScore,
      safetyScore,
      targetTime: targetTimeIso || generatedAt,
      timeLabel,
      generatedAt,
      dataFreshness: `Computed from live Open-Meteo model forecasts (${oceanObservation?.status || 'UNKNOWN'})`,
      coordinates,
      nearestPort,
      summary,
      recommendation,
      warnings,
      factors,
      criticalDataMissing: false,
      missingDataReasons: missingDataReasons.length > 0 ? missingDataReasons : undefined,
      vesselAdvisory: {
        smallCraftCaution,
        motorizedCraftCaution,
        deepSeaVesselCaution,
        guidance: vesselGuidance,
      },
      evidence: this.compileEvidence(weatherObservation, oceanObservation),
      disclaimer: ORCA_PROTOTYPE_DISCLAIMER,
    };
  }

  private compileEvidence(
    weather?: WeatherObservation | null,
    ocean?: OceanObservation | null
  ): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

    if (ocean) {
      evidence.push({
        id: `ev-ocean-${Date.now()}`,
        provider: 'Open-Meteo Marine Service',
        source: ocean.source,
        timestamp: ocean.timestamp,
        status: ocean.status,
        dataType: 'OCEAN',
        summary: `Wave Height: ${ocean.waveHeight.value ?? 'N/A'}m, Swell: ${ocean.swellWaveHeight.value ?? 'N/A'}m, SST: ${ocean.seaSurfaceTemperature.value ?? 'N/A'}°C, Current: ${ocean.oceanCurrentVelocity.value ?? 'N/A'}m/s`,
        rawMetrics: {
          waveHeight: ocean.waveHeight.value,
          wavePeriod: ocean.wavePeriod.value,
          waveDirection: ocean.waveDirection.value,
          swellHeight: ocean.swellWaveHeight.value,
          sst: ocean.seaSurfaceTemperature.value,
          currentVelocity: ocean.oceanCurrentVelocity.value,
          currentDirection: ocean.oceanCurrentDirection.value,
        },
      });
    }

    if (weather) {
      evidence.push({
        id: `ev-weather-${Date.now()}`,
        provider: 'Open-Meteo Forecast Service',
        source: weather.source,
        timestamp: weather.timestamp,
        status: weather.status,
        dataType: 'WEATHER',
        summary: `Wind Speed: ${weather.windSpeed.value ?? 'N/A'} km/h, Gusts: ${weather.windGusts.value ?? 'N/A'} km/h, Pressure: ${weather.surfacePressure.value ?? 'N/A'} hPa, Condition: ${weather.weatherDescription ?? 'N/A'}`,
        rawMetrics: {
          windSpeed: weather.windSpeed.value,
          windGusts: weather.windGusts.value,
          windDirection: weather.windDirection.value,
          surfacePressure: weather.surfacePressure.value,
          precipitation: weather.precipitation.value,
          weatherCode: weather.weatherCode.value,
          description: weather.weatherDescription,
        },
      });
    }

    return evidence;
  }
}

export const orcaRiskEngine = new ORCARiskEngine();
