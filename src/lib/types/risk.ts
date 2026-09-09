/**
 * ORCA Marine Ecosystem - Risk & Decision-Support Types
 * Deterministic model based on documented meteorological/ocean criteria.
 */

import { EvidenceItem } from './marine';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'UNKNOWN';

export type RiskFactorCategory = 
  | 'WAVE_HEIGHT'
  | 'WAVE_PERIOD'
  | 'WIND_SPEED'
  | 'WIND_GUST'
  | 'PRECIPITATION'
  | 'WEATHER_CONDITION'
  | 'OCEAN_CURRENT'
  | 'DATA_COMPLETENESS';

export interface RiskFactorResult {
  factor: RiskFactorCategory;
  label: string;
  value: number | string | null;
  unit: string;
  level: RiskLevel;
  score: number; // 0 (Low Risk / Calm) to 100 (Severe Hazard)
  weight: number; // Contribution weight
  reason: string;
  source: string;
  timestamp: string;
}

export interface SafetyRuleResult {
  ruleId: string;
  ruleName: string;
  category: 'WIND' | 'WAVE' | 'GUST' | 'DISTANCE' | 'RESTRICTION' | 'WEATHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  passed: boolean;
  thresholdDescription: string;
  observedValue: string;
  impactMessage: string;
}

export interface VesselAdvisory {
  smallCraftCaution: boolean;     // Unmotorized or small FRP boats (< 8m)
  motorizedCraftCaution: boolean; // Motorized fishing craft (8m - 15m)
  deepSeaVesselCaution: boolean;  // Large mechanized trawlers / multi-day vessels (> 15m)
  guidance: string;
}

export interface NearestPortInfo {
  portName: string;
  state: string;
  type: string;
  distanceKm: number;
  distanceNM: number;
  coordinates: [number, number]; // [lat, lon]
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  riskScore: number;          // 0 (Calm / Low Risk) to 100 (Severe Hazard)
  safetyScore: number;        // 100 - riskScore (0 = Extreme Danger, 100 = Optimal)
  targetTime: string;         // ISO 8601 evaluation timestamp
  timeLabel: string;          // Human-readable time e.g. "Tomorrow Morning (06:00 AM)"
  generatedAt: string;        // ISO 8601 generation timestamp
  dataFreshness: string;      // Freshness descriptor e.g. "Live observation retrieved < 1m ago"
  coordinates: { latitude: number; longitude: number };
  nearestPort?: NearestPortInfo;
  summary: string;
  recommendation: string;
  warnings: string[];
  factors: RiskFactorResult[];
  rulesEvaluated?: SafetyRuleResult[];
  criticalDataMissing: boolean;
  missingDataReasons?: string[];
  vesselAdvisory: VesselAdvisory;
  evidence: EvidenceItem[];
  disclaimer: string;
}
