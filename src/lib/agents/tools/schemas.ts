/**
 * ORCA Agent Tool Schemas & Definitions
 * Strict definitions and parameter schemas for allowlisted tools exposed to Gemini NLU.
 * Gemini uses these schemas to understand available capabilities and select tools dynamically.
 */

import { ToolName } from '../../types';

export interface ToolParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required?: boolean;
}

export interface ORCAToolSchema {
  name: ToolName;
  description: string;
  category: 'TELEMETRY' | 'SAFETY' | 'GEOSPATIAL' | 'HAZARDS' | 'ANALYTICS' | 'SYSTEM';
  parameters: ToolParameterSchema[];
}

export const ORCA_TOOL_SCHEMAS: Record<ToolName, ORCAToolSchema> = {
  getLocationContext: {
    name: 'getLocationContext',
    description: 'Resolve Indian coastal city, port, or region names from the query into exact geographic coordinates and coastal sector.',
    category: 'GEOSPATIAL',
    parameters: [
      { name: 'message', type: 'string', description: 'The user message or place name to resolve.', required: true },
    ],
  },
  getWeather: {
    name: 'getWeather',
    description: 'Retrieve live meteorological observations (wind speed, wind gusts, atmospheric pressure, temperature, weather condition description) from Open-Meteo Weather API.',
    category: 'TELEMETRY',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude of coastal location (-90 to 90).', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude of coastal location (-180 to 180).', required: true },
      { name: 'timeIso', type: 'string', description: 'Optional ISO timestamp for target forecast time window (e.g. tomorrow morning).' },
    ],
  },
  getMarineConditions: {
    name: 'getMarineConditions',
    description: 'Retrieve live oceanographic telemetry (significant wave height, wave direction, wave period, swell height, sea surface temperature, surface ocean current velocity) from Open-Meteo Marine API.',
    category: 'TELEMETRY',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude of marine location (-90 to 90).', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude of marine location (-180 to 180).', required: true },
      { name: 'timeIso', type: 'string', description: 'Optional ISO timestamp for target forecast time window (e.g. tomorrow morning).' },
    ],
  },
  assessMarineRisk: {
    name: 'assessMarineRisk',
    description: 'Execute the deterministic ORCA marine risk engine. Evaluates safety score (0-100), risk level (LOW/MODERATE/HIGH/SEVERE), Beaufort factor contributions, and vessel-specific advisories.',
    category: 'SAFETY',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
      { name: 'weatherData', type: 'object', description: 'Weather observation object from getWeather.' },
      { name: 'oceanData', type: 'object', description: 'Ocean observation object from getMarineConditions.' },
      { name: 'nearestPort', type: 'object', description: 'Nearest port info object from findNearestPort.' },
    ],
  },
  findNearestPort: {
    name: 'findNearestPort',
    description: 'Calculate the nearest Indian coastal port of refuge/shelter, including Great Circle distance in kilometers and Nautical Miles (NM), port type, state, and geographic bearing.',
    category: 'GEOSPATIAL',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
    ],
  },
  getMarineAlerts: {
    name: 'getMarineAlerts',
    description: 'Query live GDACS disaster alert streams for active tropical cyclones, storm surges, tsunamis, and marine meteorological warnings in the Indian maritime zone.',
    category: 'HAZARDS',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
      { name: 'radiusKm', type: 'number', description: 'Optional search radius in km (default 500km).' },
    ],
  },
  getPFZ: {
    name: 'getPFZ',
    description: 'Query Potential Fishing Zones (PFZ) advisory data. Returns reference demo dataset with SST thermal gradients and chlorophyll convergence fronts with honest institutional guidance.',
    category: 'ANALYTICS',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
    ],
  },
  getTide: {
    name: 'getTide',
    description: 'Query tidal gauge station telemetry. Returns honest UNAVAILABLE status for Survey of India / INCOIS institutional data.',
    category: 'TELEMETRY',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
    ],
  },
  getChlorophyll: {
    name: 'getChlorophyll',
    description: 'Retrieve satellite ocean color chlorophyll-a concentration (mg/m³) proxy telemetry for oceanographic productivity analysis.',
    category: 'ANALYTICS',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
    ],
  },
  getGeofences: {
    name: 'getGeofences',
    description: 'Inspect proximity to Marine Protected Areas (MPAs), marine national parks, coral reef sanctuaries, and international maritime boundaries.',
    category: 'GEOSPATIAL',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
      { name: 'radiusKm', type: 'number', description: 'Optional search radius in km.' },
    ],
  },
  findSafestRoute: {
    name: 'findSafestRoute',
    description: 'Calculate optimal deterministic A* safe passage navigation corridor avoiding shallow waters, high hazard waves, and protected marine sanctuaries.',
    category: 'SAFETY',
    parameters: [
      { name: 'originLat', type: 'number', description: 'Origin departure latitude.' },
      { name: 'originLon', type: 'number', description: 'Origin departure longitude.' },
      { name: 'destLat', type: 'number', description: 'Destination arrival latitude.' },
      { name: 'destLon', type: 'number', description: 'Destination arrival longitude.' },
      { name: 'originName', type: 'string', description: 'Optional origin port name.' },
      { name: 'destName', type: 'string', description: 'Optional destination port name.' },
    ],
  },
  analyzeMarineProductivity: {
    name: 'analyzeMarineProductivity',
    description: 'Compute multi-parameter marine productivity index combining SST fronts and chlorophyll proxy data for sustainable fishing exploration.',
    category: 'ANALYTICS',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
      { name: 'liveSstValue', type: 'number', description: 'Live SST from marine telemetry if available.' },
    ],
  },
  analyzeHistoricalMarineConditions: {
    name: 'analyzeHistoricalMarineConditions',
    description: 'Perform multi-year SST climatology analysis, seasonal monsoon trend comparisons, and historical anomaly evaluation.',
    category: 'ANALYTICS',
    parameters: [
      { name: 'latitude', type: 'number', description: 'Latitude coordinate.', required: true },
      { name: 'longitude', type: 'number', description: 'Longitude coordinate.', required: true },
    ],
  },
  getDataSourceStatus: {
    name: 'getDataSourceStatus',
    description: 'Query the status, live health, and provenance attribution of all registered data sources in ORCA.',
    category: 'SYSTEM',
    parameters: [],
  },
};
