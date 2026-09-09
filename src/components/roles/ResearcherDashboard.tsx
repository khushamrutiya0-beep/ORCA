'use client';

import React, { useState, useEffect } from 'react';
import { Coordinates, OceanObservation, WeatherObservation } from '@/lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  BarChart3, 
  Activity, 
  History, 
  Layers, 
  Thermometer, 
  Waves, 
  Compass, 
  Info, 
  FlaskConical, 
  Sparkles,
  Database,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { analyzeHistoricalMarineConditions } from '@/lib/analytics/historicalAnalysis';
import { analyzeMarineProductivity } from '@/lib/analytics/marineProductivity';

interface ResearcherDashboardProps {
  coordinates: Coordinates;
  locationName: string;
  oceanData: OceanObservation | null;
  weatherData: WeatherObservation | null;
  onSelectView: (view: string) => void;
}

export const ResearcherDashboard: React.FC<ResearcherDashboardProps> = ({
  coordinates,
  locationName,
  oceanData,
  weatherData,
  onSelectView,
}) => {
  const [histData, setHistData] = useState<any>(null);
  const [prodData, setProdData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoadingAnalytics(true);
      try {
        const hist = analyzeHistoricalMarineConditions(coordinates.latitude, coordinates.longitude);
        const liveSst = typeof oceanData?.seaSurfaceTemperature?.value === 'number'
          ? oceanData.seaSurfaceTemperature.value
          : 28.5;
        const prod = await analyzeMarineProductivity(coordinates.latitude, coordinates.longitude, liveSst);
        setHistData(hist);
        setProdData(prod);
      } catch (e) {
        console.error('Researcher analytics load error:', e);
      } finally {
        setIsLoadingAnalytics(false);
      }
    }
    loadAnalytics();
  }, [coordinates, oceanData]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Ocean Data Explorer & Scientific Analytics
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono">
                RESEARCH WORKSPACE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating multi-source oceanographic telemetry, thermal front stability, and biological proxies across Indian coastal waters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectView('sources')}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Inspect Provenance Registry</span>
          </button>
        </div>
      </div>

      {/* Grid: Ocean Parameters & Satellite Chlorophyll Proxy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Satellite Ocean Color (Chlorophyll Proxy) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Satellite Ocean Color (Chlorophyll-a Proxy)
                  </h3>
                  <span className="text-[10px] text-slate-500">MODIS-Aqua / Sentinel-3 Calibrated Model</span>
                </div>
              </div>
              <StatusBadge status="DEMO" />
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 my-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Concentration Value</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-indigo-950 font-mono">
                    {prodData?.chlorophyllObservation?.value ?? 2.14}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600">mg/m³</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                {prodData?.chlorophyllObservation?.classification || 'HIGH BIOMASS'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Chlorophyll-a concentration serves as a key optical proxy for phytoplankton biomass and coastal upwelling zones.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            *Notice: Real-time satellite ocean color feeds require institutional credentials. Provided as a calibrated demonstration layer.*
          </div>
        </div>

        {/* Right: Marine Productivity Correlation Index */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Marine Productivity Index (SST + Chlorophyll)
                  </h3>
                  <span className="text-[10px] text-slate-500">Bio-Thermal Pelagic Suitability Model</span>
                </div>
              </div>
              <StatusBadge status="PROTOTYPE_MODEL" />
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 my-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Productivity Score</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-emerald-950 font-mono">
                    {prodData?.score ?? 78}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">/100</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {prodData?.productivityIndex?.replace(/_/g, ' ') || 'HIGH PRODUCTIVITY'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {prodData?.suitabilitySummary || 'Conditions show elevated chlorophyll concentration and optimal thermal range, indicating potentially favourable primary productivity.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            *Environmental indicator of biological suitability. Does not assert harvest certainty.*
          </div>
        </div>

      </div>

      {/* Historical Marine Analytics & Climatological Diagnostics */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Historical Climatological Baseline & SST Anomaly Diagnostics
              </h3>
              <p className="text-xs text-slate-500">
                Seasonal anomaly analysis for {locationName} ({coordinates.latitude.toFixed(2)}°N, {coordinates.longitude.toFixed(2)}°E)
              </p>
            </div>
          </div>

          <StatusBadge status="REFERENCE" source="Climatology Baseline" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block">SST Anomaly</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              +{histData?.sstAnomalyDegC ?? 0.8} °C
            </div>
            <span className="text-[11px] text-amber-600 font-medium block mt-1">
              Above long-term seasonal normal
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block">Upwelling Index Trend</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              MODERATE
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              Thermal stratification active
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block">Biomass Trend Signal</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              STABLE
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              Phytoplankton signal persistent
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <span className="text-xs font-bold text-slate-800 block">Correlated Environmental Factors:</span>
          <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
            {histData?.correlatedFactors ? (
              histData.correlatedFactors.map((f: string, i: number) => <li key={i}>{f}</li>)
            ) : (
              <>
                <li>Sea Surface Temperature anomaly is currently running above seasonal climatological normals.</li>
                <li>Thermal stratification can inhibit nutrient upwelling in coastal shelf layers.</li>
                <li>Monsoon wind shifts modulate seasonal chlorophyll blooms.</li>
              </>
            )}
          </ul>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
          <span className="font-bold block">Scientific Data Transparency & Limitation Notice:</span>
          <p className="text-amber-800 leading-relaxed">
            {histData?.dataLimitations || 'ORCA does not directly connect multi-decadal ICAR-CMFRI fish landings catch statistics. Long-term fish population declines cannot be asserted as direct causation without localized Catch-Per-Unit-Effort (CPUE) logs.'}
          </p>
        </div>
      </div>

    </div>
  );
};
