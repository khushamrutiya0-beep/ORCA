'use client';

import React, { useState, useEffect } from 'react';
import { Coordinates } from '@/lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { Clock, Waves, Info, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface TidesViewProps {
  coordinates: Coordinates;
  locationName: string;
}

interface TideApiData {
  status: string;
  source: string;
  disclaimer: string;
  retrievedAt: string;
  error?: string;
  station?: {
    name: string;
    state: string;
    datum: string;
    coordinates: { latitude: number; longitude: number };
  };
}

const TIDE_GAUGE_STATIONS = [
  { name: 'Kochi Port (Vypin)', lat: 9.96, lon: 76.24, state: 'Kerala', type: 'Harmonic Station' },
  { name: 'Mumbai Harbor (Apollo Bunder)', lat: 18.92, lon: 72.83, state: 'Maharashtra', type: 'Primary Gauge' },
  { name: 'Chennai Port', lat: 13.08, lon: 80.29, state: 'Tamil Nadu', type: 'Primary Gauge' },
  { name: 'Kandla (Deendayal Port)', lat: 23.00, lon: 70.21, state: 'Gujarat', type: 'Macro-tidal Gauge' },
  { name: 'Visakhapatnam Harbor', lat: 17.69, lon: 83.29, state: 'Andhra Pradesh', type: 'Harmonic Station' },
  { name: 'Mormugao Port', lat: 15.41, lon: 73.80, state: 'Goa', type: 'Secondary Gauge' },
  { name: 'Kolkata (Garden Reach)', lat: 22.54, lon: 88.30, state: 'West Bengal', type: 'Riverine Tidal Gauge' },
];

export const TidesView: React.FC<TidesViewProps> = ({
  coordinates,
  locationName,
}) => {
  const [tideData, setTideData] = useState<TideApiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetch(`/api/tides?lat=${coordinates.latitude}&lon=${coordinates.longitude}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setTideData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [coordinates.latitude, coordinates.longitude]);
  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                National Marine Tide Gauge Network & Predictions
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                INSTITUTIONAL TIDE TABLES
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Harmonic tidal monitoring and astronomical sea level predictions for major Indian coastal ports and estuaries.
            </p>
          </div>
        </div>

        <StatusBadge status="UNAVAILABLE" source="Survey of India / NIOT" />
      </div>

      {/* Primary Honest Status Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Survey of India (SOI) Real-Time Harmonic Tide Feed Status: UNAVAILABLE</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Official real-time harmonic tide tables for Indian ports are published annually by the <strong>Survey of India (Geodetic & Research Branch)</strong> and the <strong>National Institute of Ocean Technology (NIOT)</strong>.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          In accordance with ORCA's strict scientific integrity policy, ORCA does not generate artificial or hallucinated tide numbers. Commercial vessels and fishermen should refer to the official published <em>Indian Tide Tables (INP 33)</em> or harbor master VHF announcements for critical port navigation clearances.
        </p>
      </div>

      {/* Network Stations List */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Registered Survey of India Coastal Tide Stations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIDE_GAUGE_STATIONS.map((station) => (
            <div
              key={station.name}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">{station.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{station.state}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Station Type: <strong className="text-slate-700">{station.type}</strong>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Coords: {station.lat.toFixed(2)}°N, {station.lon.toFixed(2)}°E
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-400">Feed Status:</span>
                <span className="font-semibold text-slate-500">Awaiting Auth Key</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
