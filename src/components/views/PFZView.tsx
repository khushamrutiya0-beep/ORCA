'use client';

import React from 'react';
import { Coordinates, PFZZone } from '@/lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { Fish, MapPin, Compass, AlertCircle, Info, Layers, ExternalLink } from 'lucide-react';

interface PFZViewProps {
  coordinates: Coordinates;
  locationName: string;
  pfzZones: PFZZone[];
  onSelectCoordinates: (coords: Coordinates, name?: string) => void;
}

export const PFZView: React.FC<PFZViewProps> = ({
  coordinates,
  locationName,
  pfzZones,
  onSelectCoordinates,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Fish className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Potential Fishing Zones (PFZ) Intelligence
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono">
                DEMO LAYER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Oceanographic feature identification showing sea surface thermal fronts and chlorophyll convergence proxy zones.
            </p>
          </div>
        </div>

        <StatusBadge status="DEMO" source="Reference Prototype Layer" />
      </div>

      {/* PFZ Zones List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pfzZones.map((zone) => {
          const lat = zone.coordinates ? zone.coordinates[0] : 18.9;
          const lon = zone.coordinates ? zone.coordinates[1] : 72.8;

          return (
            <div
              key={zone.id}
              className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-cardHover transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {zone.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    ID: {zone.id}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Center Coordinates:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {lat.toFixed(2)}°N, {lon.toFixed(2)}°E
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valid Until:</span>
                    <span className="font-semibold text-emerald-600">
                      {new Date(zone.validTo).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Convergence Type:</span>
                    <span className="font-semibold text-slate-800">SST Front + Chlorophyll</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectCoordinates({ latitude: lat, longitude: lon }, zone.name)}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Center Map on Zone</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Official INCOIS Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Official Institutional INCOIS PFZ Advisories Notice</span>
        </div>
        <p className="leading-relaxed">
          Official real-time PFZ advisories for Indian fishermen are generated by the Indian National Centre for Ocean Information Services (INCOIS, Ministry of Earth Sciences). Authentic real-time bulletins are disseminated via official INCOIS channels, the SAMUDRA mobile application, and electronic display boards at fishing harbors.
        </p>
      </div>

    </div>
  );
};
