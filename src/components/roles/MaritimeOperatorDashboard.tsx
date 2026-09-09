'use client';

import React, { useState } from 'react';
import { Coordinates, RiskLevel } from '@/lib/types';
import { INDIAN_COASTAL_PORTS } from '@/lib/geospatial/indianPorts';
import { optimizeSafestRoute, SafestRouteResult } from '@/lib/routing/routeOptimizer';
import { MapContainerWrapper } from '../map/MapContainerWrapper';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  Ship, 
  Route, 
  Compass, 
  ShieldCheck, 
  AlertTriangle, 
  Anchor, 
  Clock, 
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface MaritimeOperatorDashboardProps {
  coordinates: Coordinates;
  locationName: string;
  onSelectCoordinates: (coords: Coordinates, name?: string) => void;
  onSelectView: (view: string) => void;
}

export const MaritimeOperatorDashboard: React.FC<MaritimeOperatorDashboardProps> = ({
  coordinates,
  locationName,
  onSelectCoordinates,
  onSelectView,
}) => {
  // Route origin / destination
  const [originPort, setOriginPort] = useState(INDIAN_COASTAL_PORTS[0]?.name || 'Mumbai Port');
  const [destPort, setDestPort] = useState(INDIAN_COASTAL_PORTS[2]?.name || 'Kochi Port');
  const [routeResult, setRouteResult] = useState<SafestRouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateRoute = () => {
    setIsCalculating(true);
    const origin = INDIAN_COASTAL_PORTS.find((p) => p.name === originPort);
    const dest = INDIAN_COASTAL_PORTS.find((p) => p.name === destPort);

    if (origin && dest) {
      setTimeout(() => {
        const result = optimizeSafestRoute({
          origin: { name: origin.name, latitude: origin.coordinates[0], longitude: origin.coordinates[1] },
          destination: { name: dest.name, latitude: dest.coordinates[0], longitude: dest.coordinates[1] },
        });
        setRouteResult(result);
        setIsCalculating(false);
      }, 200);
    } else {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shadow-sm">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Maritime Commercial & Passage Route Command
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-mono-data">
                SEA-ONLY CORRIDORS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Deterministic risk-weighted passage planning avoiding severe wave energy, storm tracks, and Marine Protected Sanctuaries across Indian waters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="PROTOTYPE_MODEL" source="ORCA Safe Passage Mesh" showDetails />
        </div>
      </div>

      {/* Grid: Route Configuration (Left) + Interactive Route Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Port Selection & Route Performance */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Route Selector Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 marine-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    Passage Corridor Planner
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Origin → Destination Safe Track</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                WATER-ONLY
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Departure Port (Origin)
                </label>
                <select
                  value={originPort}
                  onChange={(e) => setOriginPort(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                >
                  {INDIAN_COASTAL_PORTS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Destination Port
                </label>
                <select
                  value={destPort}
                  onChange={(e) => setDestPort(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                >
                  {INDIAN_COASTAL_PORTS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.state})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={calculateRoute}
                disabled={isCalculating}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 border border-slate-800 mt-2"
              >
                <Route className="w-4 h-4 text-sky-400" />
                <span>{isCalculating ? 'Computing Water-Only Corridor...' : 'Calculate Safest Marine Track'}</span>
              </button>
            </div>
          </div>

          {/* Route Performance Card */}
          {routeResult && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 marine-card">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-slate-900 uppercase">Sea-Only Passage Corridor</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono-data ${
                  routeResult.overallRouteRisk === 'LOW'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : routeResult.overallRouteRisk === 'MODERATE'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {routeResult.overallRouteRisk} ROUTE RISK
                </span>
              </div>

              {routeResult.statusMessage && (
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70 leading-relaxed font-medium">
                  {routeResult.statusMessage}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Distance</span>
                  <div className="text-lg font-extrabold text-slate-900 font-mono-data mt-0.5">
                    {routeResult.totalDistanceNM.toFixed(1)} NM
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono-data">({routeResult.totalDistanceKm.toFixed(1)} km)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Estimated Transit</span>
                  <div className="text-lg font-extrabold text-slate-900 font-mono-data mt-0.5">
                    ~{(routeResult.totalDistanceNM / 10).toFixed(1)} hrs
                  </div>
                  <span className="text-[10px] text-slate-400">@ 10 knots cruising</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Avoided {routeResult.avoidedZones.length} Protected Marine Zone(s) • 0 Land Crossing</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Anchor className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">Corridor: <strong className="text-slate-900">{routeResult.origin.name}</strong> → <strong className="text-slate-900">{routeResult.destination.name}</strong></span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right: Interactive Route Corridor Map */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 min-w-0 flex-1">
              <Compass className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="leading-tight">Calculated Passage Corridor on Live Nautical Map</span>
            </span>
            <span className="text-[11px] text-slate-500 shrink-0 text-right font-mono-data font-semibold pl-1">
              {routeResult?.waypoints.length || 0} Corridor Waypoints
            </span>
          </div>

          <div className="h-[520px] w-full min-w-0 relative isolate z-0 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs">
            <MapContainerWrapper
              currentCoordinates={coordinates}
              onSelectCoordinates={onSelectCoordinates}
              routeWaypoints={routeResult?.waypoints}
              showPortsLayer={true}
              showGeofencesLayer={true}
              showAlertsLayer={true}
            />
          </div>
        </div>

      </div>

    </div>
  );
};
