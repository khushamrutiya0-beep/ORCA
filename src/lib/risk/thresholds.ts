/**
 * ORCA Prototype Risk Thresholds & Meteorological Criteria
 * 
 * NOTICE:
 * These thresholds are defined for the ORCA prototype decision-support system
 * based on standard oceanographic (WMO Sea State) and meteorological (Beaufort Scale) literature.
 * They do NOT represent official government directives, IMD/INCOIS statutory alerts, or certified navigational charts.
 */

export const ORCA_PROTOTYPE_DISCLAIMER = 
  'ORCA prototype decision-support assessment based on available forecast model telemetry. Not an official government directive, IMD/INCOIS alert, or guaranteed navigational safety clearance.';

export const RISK_THRESHOLDS = {
  /**
   * Significant Wave Height (meters)
   * Based on standard WMO Sea State Index (Calm, Smooth, Slight, Moderate, Rough, Very Rough, High)
   */
  waveHeight: {
    lowMax: 1.25,        // < 1.25m: Calm to Slight (Favourable for small boats)
    moderateMax: 2.0,    // 1.25m - 2.0m: Moderate (Caution for small non-mechanized craft)
    highMax: 3.5,        // 2.0m - 3.5m: Rough (Hazardous for small/medium fishing craft)
    severeThreshold: 3.5 // > 3.5m: Very Rough / High (Dangerous for all small & medium craft)
  },

  /**
   * Wave Steepness / Period (seconds)
   * Short periods (< 5s) with moderate wave heights create steep, choppy wind waves which increase capsize risk.
   */
  wavePeriod: {
    steepChopMax: 4.5,   // < 4.5s: Steep chop / short period wave hazard
    normalMin: 5.0,      // 5.0s - 10.0s: Regular swell / normal wave period
    longSwellMin: 12.0   // > 12.0s: Long period ocean swell (powerful energy near coast/reefs)
  },

  /**
   * 10-meter Wind Speed (km/h)
   * Based on the standard Beaufort Wind Scale:
   * - Beaufort 0-3 (< 20 km/h / < 11 kts): Light to Gentle Breeze
   * - Beaufort 4-5 (20 - 38 km/h / 11 - 21 kts): Moderate to Fresh Breeze
   * - Beaufort 6-7 (39 - 61 km/h / 22 - 33 kts): Strong Breeze to Near Gale
   * - Beaufort 8+ (> 61 km/h / > 33 kts): Gale / Storm Force
   */
  windSpeed: {
    lowMax: 20.0,        // < 20 km/h: Light / Calm
    moderateMax: 38.0,    // 20 - 38 km/h: Moderate Breeze
    highMax: 55.0,       // 39 - 55 km/h: Strong Wind Hazard
    severeThreshold: 55.0// > 55 km/h: Near Gale / Gale Force Hazard
  },

  /**
   * Wind Gusts (km/h)
   * Sudden peak gusts present sudden overturning risks.
   */
  windGusts: {
    lowMax: 30.0,        // < 30 km/h: Normal gusts
    moderateMax: 45.0,   // 30 - 45 km/h: Moderate gusts
    highMax: 65.0,       // 46 - 65 km/h: Strong sudden gusts
    severeThreshold: 65.0// > 65 km/h: Dangerous severe gusts
  },

  /**
   * Hourly Precipitation (mm/hr)
   * Impacts marine visibility and engine/deck safety.
   */
  precipitation: {
    lowMax: 1.0,         // < 1.0 mm: Trace / Light
    moderateMax: 7.5,    // 1.0 - 7.5 mm: Moderate Rain
    highMax: 25.0,       // 7.5 - 25.0 mm: Heavy Rain / Reduced Visibility
    severeThreshold: 25.0// > 25.0 mm: Torrential Downpour
  },

  /**
   * Ocean Surface Current Velocity (m/s)
   * Strong surface currents (> 0.7 m/s / ~1.4 knots) can drift fishing nets and challenge small craft maneuvering.
   */
  oceanCurrent: {
    lowMax: 0.4,         // < 0.4 m/s: Mild current (< 0.8 knots)
    moderateMax: 0.8,    // 0.4 - 0.8 m/s: Moderate current
    highMax: 1.5,        // 0.8 - 1.5 m/s: Strong current (Difficult net handling)
    severeThreshold: 1.5 // > 1.5 m/s: Severe current stream (> 3 knots)
  },

  /**
   * WMO Severe Weather Codes (Thunderstorms / Squalls)
   * WMO 95: Thunderstorm, slight/moderate
   * WMO 96, 99: Thunderstorm with severe hail/gusts
   */
  severeWeatherCodes: [95, 96, 99],
  moderateWeatherCodes: [55, 63, 65, 81, 82], // Dense drizzle, moderate/heavy rain showers

  /**
   * Factor Contribution Weights in Composite Scoring
   */
  weights: {
    waveHeight: 0.35,      // 35% - Primary marine factor
    windSpeed: 0.25,       // 25% - Primary atmospheric factor
    windGusts: 0.15,       // 15% - Sudden hazard factor
    weatherCondition: 0.10,// 10% - Squall / lightning risk
    precipitation: 0.05,   // 5%  - Visibility factor
    oceanCurrent: 0.10     // 10% - Drift & maneuvering factor
  }
};
