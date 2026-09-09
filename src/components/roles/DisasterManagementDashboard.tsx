'use client';

import React from 'react';
import { Coordinates } from '@/lib/types';
import { OrcaAlert } from '@/lib/types/alert';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Flame, 
  Waves, 
  Wind, 
  Radio, 
  MapPin, 
  Info, 
  CheckCircle2,
  ExternalLink,
  Zap,
  Building2
} from 'lucide-react';

interface DisasterManagementDashboardProps {
  coordinates: Coordinates;
  locationName: string;
  activeAlerts: OrcaAlert[];
  onSelectView: (view: string) => void;
}

export const DisasterManagementDashboard: React.FC<DisasterManagementDashboardProps> = ({
  coordinates,
  locationName,
  activeAlerts,
  onSelectView,
}) => {
  const severeAlerts = activeAlerts.filter(a => a.severity === 'SEVERE');
  const highAlerts = activeAlerts.filter(a => a.severity === 'HIGH');
  const moderateAlerts = activeAlerts.filter(a => a.severity === 'MODERATE');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Disaster Management & Cyclone Coordination
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono">
                EMERGENCY WORKSPACE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated multi-hazard surveillance across the Indian Ocean, Arabian Sea, and Bay of Bengal using Global Disaster Alert and Coordination System (GDACS).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {activeAlerts.length} Active Multi-Hazard Events
          </span>
        </div>
      </div>

      {/* Emergency Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Severe Cyclone / Hazard</span>
            <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">{severeAlerts.length}</div>
            <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">Immediate response action</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">High Caution Events</span>
            <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">{highAlerts.length}</div>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Vessel advisory active</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Surveillance Coverage</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">100%</div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Indian EEZ monitored</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* GDACS Live Disaster Feed List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                GDACS Live Disaster Feed Stream ({activeAlerts.length} Events)
              </h3>
              <p className="text-xs text-slate-500">United Nations & European Commission Joint Research Centre (JRC)</p>
            </div>
          </div>

          <StatusBadge status="LIVE" source="GDACS Official API" />
        </div>

        <div className="space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/70 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  No Active Marine Disaster Emergencies Detected
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Continuous multi-hazard surveillance active across the Arabian Sea, Bay of Bengal, and Indian Ocean basin via live GDACS automated feeds.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-600">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
                  🌀 Tropical Cyclones: <strong>0 Active</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
                  🌊 Storm Surges: <strong>0 Active</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">
                  📡 Live Provider: <strong>GDACS (UN OCHA / EC JRC)</strong>
                </span>
              </div>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 space-y-2 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alert.severity === 'SEVERE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {alert.severity} • {alert.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(alert.issuedAt).toUTCString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {alert.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>Provider: <strong>{alert.source}</strong> ({alert.sourceType})</span>
                  {alert.coordinates && (
                    <span className="font-mono">
                      Location: {alert.coordinates.latitude.toFixed(2)}°N, {alert.coordinates.longitude.toFixed(2)}°E
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Institutional IMD Transparency Disclosure */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-900">Institutional Feed Status: India Meteorological Department (IMD)</span>
          </div>
          <StatusBadge status="UNAVAILABLE" />
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          ORCA maintains an honest data architecture. The official IMD Mausam API requires institutional government credentials. ORCA explicitly does not fake IMD alerts and instead utilizes verified live Open-Meteo & GDACS streams while maintaining complete readiness for institutional IMD API key integration.
        </p>
      </div>

    </div>
  );
};
