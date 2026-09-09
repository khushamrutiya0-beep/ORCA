'use client';

import React from 'react';
import { Coordinates, PFZZone, RiskLevel, NearestPortInfo } from '@/lib/types';
import { OrcaAlert } from '@/lib/types/alert';
import { MapContainerWrapper } from '../map/MapContainerWrapper';
import { Compass, Layers, Info, Shield, Anchor, AlertTriangle, Fish, MapPin } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

interface LiveMapViewProps {
  coordinates: Coordinates;
  locationName: string;
  onSelectCoordinates: (coords: Coordinates, name?: string) => void;
  pfzZones: PFZZone[];
  alerts: OrcaAlert[];
  riskLevel: RiskLevel;
  nearestPort?: NearestPortInfo;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  coordinates,
  locationName,
  onSelectCoordinates,
  pfzZones,
  alerts,
  riskLevel,
  nearestPort,
}) => {
  return (
    <div className="space-y-4 flex flex-col min-h-[calc(100vh-140px)]">
      {/* Top Map HUD Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Tactical Nautical Map Explorer
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-mono-data">
                CARTO VOYAGER
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Sector: <strong className="text-slate-800">{locationName}</strong> <span className="font-mono-data font-semibold">({coordinates.latitude.toFixed(4)}°N, {coordinates.longitude.toFixed(4)}°E)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono-data hidden sm:inline">
            EEZ SECTOR 24/7
          </span>
          <StatusBadge status="LIVE" source="Open-Meteo & CartoDB" />
        </div>
      </div>

      {/* Main Map Container with Guaranteed Viewport Height */}
      <div className="w-full min-w-0 h-[580px] sm:h-[640px] lg:h-[calc(100vh-230px)] min-h-[520px] rounded-2xl overflow-hidden shadow-xs border border-slate-200/90 relative isolate z-0 bg-slate-100">
        <MapContainerWrapper
          currentCoordinates={coordinates}
          onSelectCoordinates={onSelectCoordinates}
          pfzZones={pfzZones}
          alerts={alerts}
          riskLevel={riskLevel}
          nearestPort={nearestPort}
          showPfzLayer={true}
          showPortsLayer={true}
          showAlertsLayer={true}
          showGeofencesLayer={true}
          showRadiusLayer={true}
        />
      </div>

      {/* Map Legend & Layer Reference Strip */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase text-[10px] tracking-wider">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Active Nautical Layers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-2xs" />
            <span>Target Vessel Location</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Shelter Harbors & Ports</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
            <span>PFZ Convergence Zones</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span>Emergency Hazard Alerts</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-md bg-amber-500/30 border border-amber-500" />
            <span>Marine Protected Sanctuaries</span>
          </div>
        </div>
      </div>
    </div>
  );
};
