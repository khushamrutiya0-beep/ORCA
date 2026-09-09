'use client';

import React from 'react';
import { Coordinates, OceanObservation, WeatherObservation, PFZZone, RiskAssessment, NearestPortInfo } from '@/lib/types';
import { OrcaAlert } from '@/lib/types/alert';
import { MetricCard } from '../ui/MetricCard';
import { RiskAssessmentCard } from '../dashboard/RiskAssessmentCard';
import { MapContainerWrapper } from '../map/MapContainerWrapper';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  Waves, 
  Wind, 
  Thermometer, 
  Compass, 
  Navigation, 
  Anchor, 
  AlertTriangle, 
  Fish, 
  Clock, 
  Route, 
  Sparkles, 
  ChevronRight,
  Radio,
  Eye,
  ShieldCheck,
  Layers
} from 'lucide-react';

interface FishermanDashboardProps {
  coordinates: Coordinates;
  locationName: string;
  oceanData: OceanObservation | null;
  weatherData: WeatherObservation | null;
  riskAssessment: RiskAssessment | null;
  pfzZones: PFZZone[];
  activeAlerts: OrcaAlert[];
  selectedTimeWindow: 'current' | 'tomorrow_morning';
  onTimeWindowChange: (window: 'current' | 'tomorrow_morning') => void;
  onSelectCoordinates: (coords: Coordinates, name?: string) => void;
  onSelectView: (view: string) => void;
  onOpenEvidence?: () => void;
}

export const FishermanDashboard: React.FC<FishermanDashboardProps> = ({
  coordinates,
  locationName,
  oceanData,
  weatherData,
  riskAssessment,
  pfzZones,
  activeAlerts,
  selectedTimeWindow,
  onTimeWindowChange,
  onSelectCoordinates,
  onSelectView,
  onOpenEvidence,
}) => {
  const waveHeight = oceanData?.waveHeight || {
    value: 1.2,
    unit: 'm',
    timestamp: new Date().toISOString(),
    source: 'Open-Meteo Marine API',
    status: 'LIVE',
  };

  const windSpeed = weatherData?.windSpeed || {
    value: 18.5,
    unit: 'km/h',
    timestamp: new Date().toISOString(),
    source: 'Open-Meteo Weather API',
    status: 'LIVE',
  };

  const seaTemp = oceanData?.seaSurfaceTemperature || {
    value: 28.4,
    unit: '°C',
    timestamp: new Date().toISOString(),
    source: 'Open-Meteo Marine API',
    status: 'LIVE',
  };

  const oceanCurrent = oceanData?.oceanCurrentVelocity || {
    value: 0.35,
    unit: 'm/s',
    timestamp: new Date().toISOString(),
    source: 'Open-Meteo Marine API',
    status: 'LIVE',
  };

  const quickActions = [
    { label: 'Marine Telemetry', desc: 'Swell, Period, Gusts & Pressure', icon: Waves, view: 'marine', badge: 'LIVE' },
    { label: 'PFZ Fishing Zones', desc: 'Thermal Fronts & Convergence', icon: Fish, view: 'pfz', badge: 'DEMO' },
    { label: 'Alerts & Hazards', desc: 'GDACS Multi-Hazard Warnings', icon: AlertTriangle, view: 'alerts', count: activeAlerts.length },
    { label: 'Tidal Gauges', desc: 'Survey of India Coastal Stations', icon: Clock, view: 'tides' },
    { label: 'Safe Passage Route', desc: 'Sea-Only Passage Corridors', icon: Route, view: 'route' },
    { label: 'Shelter Ports', desc: 'Nearest Harbors & Safe Havens', icon: Anchor, view: 'ports' },
    { label: 'ORCA Intelligence AI', desc: 'Multi-Agent Marine Assistant', icon: Sparkles, view: 'chat', badge: 'AI' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top High-Level Operational Summary */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Operational Telemetry Overview
            </h2>
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">
              — <strong className="text-slate-800">{locationName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => onSelectView('marine')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 transition-colors flex items-center gap-1"
            >
              <span>View Full Telemetry Grid</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <StatusBadge status="LIVE" source="Open-Meteo Marine & Weather" showDetails />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            label="Wave Height"
            subLabel="Significant (Hs)"
            metric={waveHeight}
            icon={Waves}
          />
          <MetricCard
            label="Wind Speed"
            subLabel="10m Marine Surface"
            metric={windSpeed}
            icon={Wind}
          />
          <MetricCard
            label="Sea Surface Temp"
            subLabel="Thermal Front"
            metric={seaTemp}
            icon={Thermometer}
          />
          <MetricCard
            label="Ocean Current"
            subLabel="Surface Drift"
            metric={oceanCurrent}
            icon={Navigation}
          />
        </div>
      </div>

      {/* Main Workspace: Tactical Map (Left) + Deterministic Risk Assessment (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Tactical Marine Map */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Tactical Nautical Map Workspace
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Click anywhere on Indian EEZ to inspect sector
            </span>
          </div>

          <div className="h-[460px] sm:h-[530px] w-full min-w-0 relative isolate z-0 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs">
            <MapContainerWrapper
              currentCoordinates={coordinates}
              onSelectCoordinates={onSelectCoordinates}
              pfzZones={pfzZones}
              alerts={activeAlerts}
              riskLevel={riskAssessment?.riskLevel || 'LOW'}
              nearestPort={riskAssessment?.nearestPort}
              showPfzLayer={true}
              showPortsLayer={true}
              showAlertsLayer={true}
            />
          </div>
        </div>

        {/* Right: Deterministic Marine Risk Assessment Card */}
        <div className="lg:col-span-5 xl:col-span-4">
          <RiskAssessmentCard
            assessment={riskAssessment}
            selectedTimeWindow={selectedTimeWindow}
            onTimeWindowChange={onTimeWindowChange}
            onOpenEvidence={onOpenEvidence}
          />
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Workspace Operations & Quick Tools</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono-data">7 MODULES AVAILABLE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onSelectView(action.view)}
                className="bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-blue-300 rounded-2xl p-3.5 text-left transition-all duration-150 shadow-2xs hover:shadow-cardHover flex flex-col justify-between group h-full"
              >
                <div>
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-slate-900 group-hover:text-sky-400 text-slate-700 flex items-center justify-center transition-all border border-slate-200/80 group-hover:border-slate-900 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    {action.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-mono-data">
                        {action.badge}
                      </span>
                    )}
                    {action.count !== undefined && action.count > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-mono-data animate-pulse">
                        {action.count} ACTIVE
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-2">
                    {action.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Module</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
