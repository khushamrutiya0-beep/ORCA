'use client';

import React from 'react';
import { Coordinates, RiskAssessment } from '@/lib/types';
import { OrcaAlert } from '@/lib/types/alert';
import { INDIAN_COASTAL_PORTS } from '@/lib/geospatial/indianPorts';
import { INDIAN_MARITIME_GEOFENCES } from '@/lib/geofencing/geofenceService';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  Building2, 
  Anchor, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Compass, 
  Navigation,
  Layers,
  ChevronRight,
  Radio
} from 'lucide-react';

interface CoastalAuthorityDashboardProps {
  coordinates: Coordinates;
  locationName: string;
  riskAssessment: RiskAssessment | null;
  activeAlerts: OrcaAlert[];
  onSelectCoordinates: (coords: Coordinates, name?: string) => void;
  onSelectView: (view: string) => void;
}

export const CoastalAuthorityDashboard: React.FC<CoastalAuthorityDashboardProps> = ({
  coordinates,
  locationName,
  riskAssessment,
  activeAlerts,
  onSelectCoordinates,
  onSelectView,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Coastal Authority & Port Management Command
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-mono">
                AUTHORITY WORKSPACE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervising coastal sector readiness, port shelter operations, Marine Protected Areas, and safety advisories across Indian coastal jurisdictions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            14 Major & Minor Ports Operational
          </span>
        </div>
      </div>

      {/* Grid: Coastal Ports Status Matrix + Marine Protected Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Indian Coastal Ports Matrix */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Anchor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Indian Coastal Ports Directory ({INDIAN_COASTAL_PORTS.length} Ports)
                  </h3>
                  <span className="text-[10px] text-slate-500">Ministry of Ports, Shipping and Waterways Reference</span>
                </div>
              </div>
              <StatusBadge status="REFERENCE" />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {INDIAN_COASTAL_PORTS.map((port) => (
                <div
                  key={port.name}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{port.name}</div>
                    <div className="text-[11px] text-slate-500">{port.state} • {port.type} Port</div>
                  </div>

                  <button
                    onClick={() => onSelectCoordinates({ latitude: port.coordinates[0], longitude: port.coordinates[1] }, port.name)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Marine Protected Areas & Boundary Geofences */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Marine Protected Areas & Geofences ({INDIAN_MARITIME_GEOFENCES.length} Zones)
                  </h3>
                  <span className="text-[10px] text-slate-500">MoEFCC / Wildlife Institute of India Boundaries</span>
                </div>
              </div>
              <StatusBadge status="REFERENCE" />
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {INDIAN_MARITIME_GEOFENCES.map((geo) => (
                <div
                  key={geo.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate min-w-0">{geo.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      geo.restrictionLevel === 'PROHIBITED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {geo.restrictionLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{geo.description}</p>
                  <div className="text-[10px] text-slate-400">Authority: {geo.authority}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Active Advisories Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">
              Active Coastal & Marine Safety Advisories
            </h3>
          </div>
          <StatusBadge status="LIVE" source="ORCA Advisory Engine" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1">
            <span className="text-xs font-bold text-blue-900 block">Vessel Category Advisory</span>
            <p className="text-xs text-blue-800 leading-relaxed">
              {riskAssessment?.recommendation || 'Standard coastal operations permitted with continuous meteorological monitoring.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-xs font-bold text-slate-900 block">Emergency Shelter Readiness</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nearest harbor facility: <strong>{riskAssessment?.nearestPort?.portName || 'Port Facility'}</strong> (~{riskAssessment?.nearestPort?.distanceKm || '0'} km). Berth availability normal.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
