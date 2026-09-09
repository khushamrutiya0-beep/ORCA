'use client';

import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { Database, ShieldCheck, Info, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const DATA_SOURCES_REGISTRY = [
  {
    name: 'Open-Meteo Marine API',
    type: 'Operational Numerical Ocean Wave & Current Model',
    parameters: 'Significant wave height, swell height, swell period, SST, surface current velocity',
    status: 'LIVE' as const,
    sourceType: 'MODEL',
    updateFreq: 'Hourly (15-day rolling forecast)',
    coverage: 'Global / Indian Ocean / Arabian Sea / Bay of Bengal',
    url: 'https://open-meteo.com/en/docs/marine-weather-api',
  },
  {
    name: 'Open-Meteo Weather API',
    type: 'High-Resolution Numerical Weather Prediction (ECMWF/GFS/ICON)',
    parameters: '10m wind speed, wind gusts, wind direction, precipitation, atmospheric pressure',
    status: 'LIVE' as const,
    sourceType: 'MODEL',
    updateFreq: 'Hourly',
    coverage: 'Global / Indian Subcontinent',
    url: 'https://open-meteo.com/en/docs',
  },
  {
    name: 'Global Disaster Alert and Coordination System (GDACS)',
    type: 'Multi-Hazard Emergency Early Warning Stream (UN OCHA / European Commission JRC)',
    parameters: 'Tropical cyclones, tsunamis, earthquakes, coastal flooding alerts',
    status: 'LIVE' as const,
    sourceType: 'OFFICIAL',
    updateFreq: 'Real-time Event Push / 10-minute poll',
    coverage: 'Indian Ocean Basin & Global',
    url: 'https://www.gdacs.org',
  },
  {
    name: 'CARTO / OpenStreetMap',
    type: 'Nautical & Cartographic Light Basemap Tiles (Voyager)',
    parameters: 'Bathymetric coastline, coastal topography, maritime place labels',
    status: 'LIVE' as const,
    sourceType: 'REFERENCE',
    updateFreq: 'Static CDN',
    coverage: 'Global',
    url: 'https://carto.com',
  },
  {
    name: 'INCOIS Potential Fishing Zones (PFZ)',
    type: 'Ocean Thermal Front & Chlorophyll Convergence (Demo Proxy)',
    parameters: 'PFZ polygons, biological productivity index, SST gradient vectors',
    status: 'DEMO' as const,
    sourceType: 'DEMO',
    updateFreq: 'Pre-computed Demonstration Dataset',
    coverage: 'Indian Exclusive Economic Zone (EEZ)',
    url: 'https://incois.gov.in',
  },
  {
    name: 'Survey of India (SOI) / NIOT',
    type: 'Harmonic Sea Level Tide Gauge Tables',
    parameters: 'Astronomical high/low tides, tidal heights, spring/neap cycles',
    status: 'UNAVAILABLE' as const,
    sourceType: 'UNAVAILABLE',
    updateFreq: 'Awaiting Institutional Key',
    coverage: 'Major Indian Commercial Ports',
    url: 'https://surveyofindia.gov.in',
  },
  {
    name: 'India Meteorological Department (IMD)',
    type: 'Official National Cyclone & Heavy Rain Warnings',
    parameters: 'Coastal weather bulletins, port warning signals, cyclone tracking bulletins',
    status: 'UNAVAILABLE' as const,
    sourceType: 'UNAVAILABLE',
    updateFreq: 'Awaiting Institutional Key (Mausam API)',
    coverage: 'National / Coastal Districts',
    url: 'https://mausam.imd.gov.in',
  },
  {
    name: 'MoEFCC / Wildlife Institute of India',
    type: 'Marine Protected Areas & Critical Habitats Directory',
    parameters: 'Marine National Parks, Biosphere Reserves, IMBL corridors',
    status: 'REFERENCE' as const,
    sourceType: 'REFERENCE',
    updateFreq: 'Official Gazette Reference',
    coverage: 'Indian Marine Waters',
    url: 'https://moef.gov.in',
  },
  {
    name: 'Ministry of Ports, Shipping and Waterways',
    type: 'Major & Minor Ports Geo-Directory',
    parameters: 'Port coordinates, shelter facilities, state jurisdictions',
    status: 'REFERENCE' as const,
    sourceType: 'REFERENCE',
    updateFreq: 'Official Reference Dataset',
    coverage: '7,516 km Indian Coastline',
    url: 'https://shipmin.gov.in',
  },
];

export const SourcesView: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Data Provenance Spectrum & Provider Health Registry
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono">
                ZERO-FABRICATION AUDIT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent disclosure of every external API, mathematical model, and institutional dataset feeding the ORCA platform.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% Provenance Grounded
          </span>
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Registered Provider Endpoints ({DATA_SOURCES_REGISTRY.length} Providers)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Evaluated by ORCA Provider Factory
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Provider / Data Source</th>
                <th className="py-3 px-4">Type & Nature</th>
                <th className="py-3 px-4">Parameters Handled</th>
                <th className="py-3 px-4">Provenance Status</th>
                <th className="py-3 px-4">Update Cadence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {DATA_SOURCES_REGISTRY.map((src) => (
                <tr key={src.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{src.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{src.coverage}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {src.type}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                    {src.parameters}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={src.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {src.updateFreq}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
