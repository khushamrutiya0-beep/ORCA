'use client';

import React from 'react';
import { Coordinates } from '@/lib/types';
import { INDIAN_MARITIME_GEOFENCES } from '@/lib/geofencing/geofenceService';
import { StatusBadge } from '../ui/StatusBadge';
import { ShieldAlert, ShieldCheck, MapPin, Compass, AlertTriangle, Info, ExternalLink } from 'lucide-react';

interface GeofencesViewProps {
  coordinates: Coordinates;
  locationName: string;
  onSelectCoordinates: (coords: Coordinates, name?: string) => void;
}

export const GeofencesView: React.FC<GeofencesViewProps> = ({
  coordinates,
  locationName,
  onSelectCoordinates,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Marine Protected Areas & Maritime Geofences
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono">
                COMPLIANCE DIRECTORY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official maritime sanctuaries, critical biosphere reserves, and international boundary corridors evaluated by ORCA routing.
            </p>
          </div>
        </div>

        <StatusBadge status="REFERENCE" source="MoEFCC / WII / ICG" />
      </div>

      {/* Geofences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INDIAN_MARITIME_GEOFENCES.map((geo) => {
          const isProhibited = geo.restrictionLevel === 'PROHIBITED';

          return (
            <div
              key={geo.id}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isProhibited ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {geo.restrictionLevel} • {geo.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono text-right truncate">ID: {geo.id}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{geo.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{geo.description}</p>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div>Enforcing Authority: <strong className="text-slate-800">{geo.authority}</strong></div>
                  <div>Source: <strong className="text-slate-700">{geo.source}</strong></div>
                </div>
              </div>

              <button
                onClick={() => {
                  const firstPt = geo.coordinates[0];
                  if (firstPt) {
                    onSelectCoordinates({ latitude: firstPt[0], longitude: firstPt[1] }, geo.name);
                  }
                }}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Locate Geofence on Map</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
