'use client';

import React, { useEffect, useState } from 'react';
import { Coordinates, DataStatus } from '@/lib/types';
import { Compass, RefreshCw, Waves } from 'lucide-react';

interface TopNavBarProps {
  currentCoordinates: Coordinates;
  onOpenLocationModal?: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  oceanStatus?: DataStatus;
  weatherStatus?: DataStatus;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentCoordinates,
  onOpenLocationModal,
  isRefreshing = false,
  onRefresh,
  oceanStatus = 'LIVE',
  weatherStatus = 'LIVE',
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ').slice(4, 5)[0] + ' UTC');
      setIstTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: DataStatus, label: string) => {
    if (status === 'LIVE') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[9px] font-mono font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {label}: LIVE
        </span>
      );
    }
    if (status === 'DELAYED') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700/60 text-amber-300 text-[9px] font-mono font-semibold">
          {label}: DELAYED
        </span>
      );
    }
    if (status === 'DEMO') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-yellow-950 border border-yellow-700/60 text-yellow-300 text-[9px] font-mono font-semibold">
          {label}: DEMO
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[9px] font-mono font-semibold">
        {label}: UNAVAILABLE
      </span>
    );
  };

  return (
    <header className="h-16 bg-ocean-950/90 border-b border-ocean-800/80 px-4 flex items-center justify-between backdrop-blur-md z-30 sticky top-0">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-ocean-600 to-blue-500 p-0.5 shadow-glow flex items-center justify-center">
          <div className="w-full h-full bg-ocean-950 rounded-[10px] flex items-center justify-center">
            <Waves className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-white text-lg font-mono">
              ORCA
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
              v0.2.0 LIVE PIPELINE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Marine Ecosystem Reasoning with Collaborative Agents
          </p>
        </div>
      </div>

      {/* Center Coordinates & Location Indicator */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ocean-900/80 border border-ocean-700/80 hover:border-cyan-500/60 transition-all text-xs font-mono group"
          title="Click to change target ocean coordinates"
        >
          <Compass className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="font-semibold text-white">
              {currentCoordinates.latitude.toFixed(4)}°N
            </span>
            <span className="text-slate-500">|</span>
            <span className="font-semibold text-white">
              {currentCoordinates.longitude.toFixed(4)}°E
            </span>
          </div>
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-ocean-900/80 border border-ocean-700/80 hover:border-cyan-500/60 text-cyan-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh live marine and weather observation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Right: Time & Telemetry Status Badges */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className="hidden lg:flex flex-col items-end text-[11px] font-mono text-slate-400">
          <span className="text-slate-200 font-semibold">{istTime || '--:--:-- IST'}</span>
          <span className="text-[10px] text-slate-400">{utcTime || '--:--:-- UTC'}</span>
        </div>

        {/* Pipeline Health Badges */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-ocean-800">
          <div className="flex flex-col items-end text-[10px] font-mono text-slate-400">
            <span className="text-slate-400">DATA PIPELINES</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {getStatusBadge(oceanStatus, 'OCEAN')}
              {getStatusBadge(weatherStatus, 'WEATHER')}
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[9px] font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ALERTS: GDACS
              </span>
              <span className="px-1.5 py-0.5 rounded bg-yellow-950 border border-yellow-700/60 text-yellow-300 text-[9px] font-mono font-semibold">
                PFZ: DEMO
              </span>
            </div>
          </div>
        </div>

        {/* Command Center Link */}
        <div className="pl-3 border-l border-ocean-800">
          <a
            href="/command"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 hover:border-cyan-500 text-cyan-400 hover:text-white transition-all text-[10px] font-mono font-semibold"
            title="Open ORCA Command Center"
          >
            🛰 CMD
          </a>
        </div>
      </div>
    </header>
  );
};
