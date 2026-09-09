/**
 * ORCA Data Source Registry — Milestone 5
 * Authoritative, honest record of every investigated Indian maritime data source.
 * Status is only marked LIVE when tested and verified.
 * DO NOT mark any source LIVE without confirming the endpoint works.
 */

import { DataSourceRecord } from '../types/alert';

export const DATA_SOURCE_REGISTRY: DataSourceRecord[] = [
  // =========================================================================
  // CURRENTLY LIVE (Integrated)
  // =========================================================================
  {
    id: 'open-meteo-weather',
    name: 'Open-Meteo Weather Forecast API',
    organization: 'Open-Meteo',
    category: 'WEATHER',
    status: 'LIVE',
    accessType: 'PUBLIC_API',
    endpoint: 'https://api.open-meteo.com/v1/forecast',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'Hourly',
    coverage: 'Global — Indian coast confirmed working',
    notes: 'Based on ERA5/GFS/ICON. No API key required for non-commercial use. ORCA uses this for all weather data.',
    testedAt: '2026-08-24',
    testedLive: true,
  },
  {
    id: 'open-meteo-marine',
    name: 'Open-Meteo Marine Forecast API',
    organization: 'Open-Meteo (Copernicus / ECMWF / DWD)',
    category: 'MARINE',
    status: 'LIVE',
    accessType: 'PUBLIC_API',
    endpoint: 'https://marine-api.open-meteo.com/v1/marine',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'Hourly',
    coverage: 'Global ocean including Indian Ocean, Arabian Sea, Bay of Bengal',
    notes: 'Wave height, period, direction, swell, SST, current velocity. No API key required. ORCA uses this for all marine data.',
    testedAt: '2026-08-24',
    testedLive: true,
  },
  {
    id: 'gdacs-alerts',
    name: 'GDACS — Global Disaster Alert and Coordination System',
    organization: 'UN OCHA / EU Joint Research Centre (JRC)',
    category: 'ALERT',
    status: 'LIVE',
    accessType: 'PUBLIC_API',
    endpoint: 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'Every few hours (event-driven)',
    coverage: 'Global — Indian Ocean / Arabian Sea / Bay of Bengal filtered in ORCA',
    notes: 'Returns GeoJSON FeatureCollection of active events (TC, FL, EQ, WF). Filtered for Indian maritime zone (lat 5°–30°N, lon 55°–100°E). Source attribution in every alert. Live-tested 2026-08-24.',
    testedAt: '2026-08-24',
    testedLive: true,
  },

  // =========================================================================
  // REQUIRES CREDENTIALS (Future Integration Ready)
  // =========================================================================
  {
    id: 'imd-official',
    name: 'India Meteorological Department (IMD) API',
    organization: 'India Meteorological Department, Government of India',
    category: 'ALERT',
    status: 'REQUIRES_CREDENTIALS',
    accessType: 'REGISTERED_API',
    endpoint: 'https://api.imd.gov.in/',
    requiresCredentials: true,
    isFree: false,
    updateFrequency: 'Multiple times daily (cyclone bulletins as needed)',
    coverage: 'India, Indian Ocean, Bay of Bengal, Arabian Sea',
    notes: 'Official Indian government weather/cyclone warnings. Requires account registration, API key, and potentially IP whitelisting at api.imd.gov.in. Contact: sankar.nath@imd.gov.in. When credentials are obtained, set INCOIS_IMD_API_KEY env variable and update imdAlertProvider.ts.',
    testedAt: '2026-08-24',
    testedLive: false,
  },
  {
    id: 'incois-pfz',
    name: 'INCOIS Potential Fishing Zone (PFZ) Advisory',
    organization: 'Indian National Centre for Ocean Information Services (INCOIS), MoES',
    category: 'PFZ',
    status: 'REQUIRES_CREDENTIALS',
    accessType: 'NONE',
    requiresCredentials: true,
    isFree: true,
    updateFrequency: 'Daily (depends on satellite passes)',
    coverage: 'Indian EEZ — Bay of Bengal, Arabian Sea',
    notes: 'No public machine-readable REST API exists. Data available via incois.gov.in WebGIS and SAMUDRA mobile app only. ORCA uses DEMO PFZ data until INCOIS provides a verified API endpoint. Research: institutional collaboration or data-sharing agreement with INCOIS required.',
    testedAt: '2026-08-24',
    testedLive: false,
  },

  // =========================================================================
  // DEMO & PROTOTYPE MODEL CAPABILITIES
  // =========================================================================
  {
    id: 'demo-satellite-chlorophyll',
    name: 'ORCA Satellite Ocean Color (MODIS/Sentinel-3 Proxy)',
    organization: 'ORCA Ocean Color Demonstration Engine',
    category: 'SATELLITE',
    status: 'DEMO',
    accessType: 'PUBLIC_API',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'Simulated',
    coverage: 'Indian Coastal Shelf & EEZ',
    notes: 'Chlorophyll-a ocean color proxy calibrated to coastal upwelling zones. Open real-time NASA/Copernicus Level-3 feeds require authenticated credentials. Explicitly marked DEMO.',
    testedAt: '2026-08-25',
    testedLive: false,
  },
  {
    id: 'soi-incois-tides',
    name: 'Survey of India / INCOIS National Tide Network',
    organization: 'Survey of India (SoI) / INCOIS, MoES',
    category: 'TIDE',
    status: 'UNAVAILABLE',
    accessType: 'NONE',
    requiresCredentials: true,
    isFree: false,
    updateFrequency: 'Astronomical / Sensor',
    coverage: 'Indian Ports and Coastal Gauge Stations',
    notes: 'Official tidal predictions require institutional data agreements. No open public programmatic REST endpoint is connected. Tide data is honestly reported as UNAVAILABLE (zero fabrication).',
    testedAt: '2026-08-25',
    testedLive: false,
  },
  {
    id: 'orca-geofences',
    name: 'MoEFCC / WII Marine Protected Areas & Coast Guard IMBL',
    organization: 'Ministry of Environment, Forest & Climate Change / WII',
    category: 'GEOFENCE',
    status: 'REFERENCE',
    accessType: 'PUBLIC_DATASET',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'Static Reference',
    coverage: 'Gulf of Mannar, Gulf of Kutch, Malvan, Gahirmatha, IMBL Buffers',
    notes: 'Curated spatial polygons and buffer zones for Indian Marine National Parks, Sanctuaries, and International Maritime Boundary Lines. Reference status.',
    testedAt: '2026-08-25',
    testedLive: true,
  },
  {
    id: 'orca-routing-engine',
    name: 'ORCA Safe Passage Optimization Engine',
    organization: 'ORCA Decision Support System',
    category: 'ROUTING',
    status: 'PROTOTYPE_MODEL',
    accessType: 'INTERNAL',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'On-Demand Deterministic Calculation',
    coverage: 'Indian Ocean, Arabian Sea, Bay of Bengal',
    notes: 'Computes cost-minimized maritime passage corridors avoiding wave/wind hazards and marine sanctuaries. Prototype decision support only.',
    testedAt: '2026-08-25',
    testedLive: true,
  },
  {
    id: 'orca-productivity-engine',
    name: 'ORCA Marine Productivity Correlation Engine',
    organization: 'ORCA Decision Support System',
    category: 'PRODUCTIVITY',
    status: 'PROTOTYPE_MODEL',
    accessType: 'INTERNAL',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'On-Demand Real-Time Correlation',
    coverage: 'Indian Coastal Shelf & EEZ',
    notes: 'Correlates live Sea Surface Temperature (SST) with chlorophyll-a proxies to identify potentially favourable pelagic feeding zones.',
    testedAt: '2026-08-25',
    testedLive: true,
  },

  // =========================================================================
  // UNAVAILABLE / STATIC
  // =========================================================================
  {
    id: 'data-gov-in',
    name: 'Open Government Data Platform India (data.gov.in)',
    organization: 'National Informatics Centre (NIC), MeitY',
    category: 'ADVISORY',
    status: 'UNAVAILABLE',
    accessType: 'NONE',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'Annual / Ad-hoc',
    coverage: 'India',
    notes: 'Contains static datasets only (e.g. historical annual fish landing totals). No real-time weather, marine, or alert APIs available on data.gov.in.',
    testedAt: '2026-08-24',
    testedLive: false,
  },
  {
    id: 'cmfri-catch-data',
    name: 'ICAR-Central Marine Fisheries Research Institute (CMFRI)',
    organization: 'ICAR-CMFRI, Kochi, Kerala',
    category: 'ADVISORY',
    status: 'UNAVAILABLE',
    accessType: 'NONE',
    requiresCredentials: false,
    isFree: false,
    updateFrequency: 'Annual Reports',
    coverage: 'Indian Coastal States',
    notes: 'CMFRI publishes annual marine fish landings estimates and species-wise catch data as PDF reports and research publications. No public REST API exists. Valuable for future historical trend integrations.',
    testedAt: '2026-08-24',
    testedLive: false,
  },
  {
    id: 'orca-risk-engine',
    name: 'ORCA Deterministic Risk Engine',
    organization: 'ORCA Decision Support Model (Prototype)',
    category: 'RISK_ENGINE',
    status: 'LIVE',
    accessType: 'INTERNAL',
    requiresCredentials: false,
    isFree: true,
    updateFrequency: 'On-demand calculation',
    coverage: 'Indian Coastal Waters (15 NM reference zone)',
    notes: 'Deterministic safety calculation based on WMO Beaufort wind scale, sea state matrices, and port proximity. Transparent factor-by-factor breakdown. Zero hallucination.',
    testedAt: '2026-08-24',
    testedLive: true,
  },
];

/**
 * Returns all source records.
 */
export function getAllSources(): DataSourceRecord[] {
  return DATA_SOURCE_REGISTRY;
}

/**
 * Returns sources by category.
 */
export function getSourcesByCategory(category: DataSourceRecord['category']): DataSourceRecord[] {
  return DATA_SOURCE_REGISTRY.filter(s => s.category === category);
}

/**
 * Returns the source record by ID.
 */
export function getSourceById(id: string): DataSourceRecord | undefined {
  return DATA_SOURCE_REGISTRY.find(s => s.id === id);
}

/**
 * Returns source health summary: count by status.
 */
export function getSourceHealthSummary(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const source of DATA_SOURCE_REGISTRY) {
    counts[source.status] = (counts[source.status] ?? 0) + 1;
  }
  return counts;
}
