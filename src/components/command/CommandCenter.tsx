'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Database, Shield, Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import { DataSourceRecord, OrcaAlert, CommandCenterData } from '@/lib/types/alert';

const SEVERITY_CONFIG = {
  SEVERE: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '#ef4444', icon: '🔴', label: 'SEVERE' },
  HIGH: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: '#f97316', icon: '🟠', label: 'HIGH' },
  MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', icon: '🟡', label: 'MODERATE' },
  LOW: { color: '#06b6d4', bg: 'rgba(6,182,212,0.10)', border: '#06b6d4', icon: 'ℹ️', label: 'LOW' },
  INFO: { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: '#475569', icon: 'ℹ️', label: 'INFO' },
};

const SOURCE_STATUS_CONFIG: Record<string, { color: string; label: string; dot: string }> = {
  LIVE: { color: '#10b981', label: 'LIVE', dot: '#10b981' },
  AVAILABLE: { color: '#06b6d4', label: 'AVAILABLE', dot: '#06b6d4' },
  DEMO: { color: '#f59e0b', label: 'DEMO', dot: '#f59e0b' },
  REQUIRES_CREDENTIALS: { color: '#f97316', label: 'REQUIRES CREDENTIALS', dot: '#f97316' },
  UNAVAILABLE: { color: '#6b7280', label: 'UNAVAILABLE', dot: '#6b7280' },
};

function AlertCard({ alert }: { alert: OrcaAlert }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.INFO;

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{ borderColor: cfg.border, background: cfg.bg }}
      className="border rounded-xl p-3 cursor-pointer transition-all hover:brightness-110"
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-white truncate">{alert.title}</span>
            <span
              style={{ color: cfg.color, borderColor: cfg.border }}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0"
            >
              {alert.severity}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
            <span>{alert.type.replace('_', ' ')}</span>
            {alert.affectedArea && <><span>·</span><span>{alert.affectedArea}</span></>}
          </div>
          {expanded && (
            <div className="mt-2 space-y-1 text-[11px] text-slate-300 border-t border-white/10 pt-2">
              <p>{alert.description}</p>
              {alert.coordinates && (
                <p className="font-mono text-cyan-400">
                  📍 {alert.coordinates.latitude.toFixed(2)}°N, {alert.coordinates.longitude.toFixed(2)}°E
                </p>
              )}
              <p className="text-[10px] text-slate-400">
                Issued: {new Date(alert.issuedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </p>
              <p className="text-[10px] text-emerald-400 font-mono">
                SOURCE: {alert.source}
              </p>
              {alert.sourceUrl && (
                <a
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline text-[10px]"
                  onClick={e => e.stopPropagation()}
                >
                  → View on {alert.source.split(' ')[0]}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceRow({ source }: { source: DataSourceRecord }) {
  const cfg = SOURCE_STATUS_CONFIG[source.status] ?? SOURCE_STATUS_CONFIG.UNAVAILABLE;
  return (
    <div className="flex items-center justify-between py-2 border-b border-ocean-800/60 last:border-0">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <span
          style={{ backgroundColor: cfg.dot }}
          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${source.status === 'LIVE' ? 'animate-pulse' : ''}`}
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-200 truncate">{source.name}</p>
          <p className="text-[10px] text-slate-500 truncate">{source.organization}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <span
          style={{ color: cfg.color, borderColor: cfg.color + '44' }}
          className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
        >
          {cfg.label}
        </span>
        <span
          className="text-[9px] font-mono px-1 py-0.5 rounded bg-ocean-900/60 text-slate-400 border border-ocean-800"
        >
          {source.category}
        </span>
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/command-center?lat=15&lon=74');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: CommandCenterData = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, []);

  const totalAlerts = data ? (data.alertSummary.severe + data.alertSummary.high + data.alertSummary.moderate + data.alertSummary.info) : 0;
  const liveSourceCount = data?.dataSourceHealth.filter(s => s.status === 'LIVE').length ?? 0;
  const totalSourceCount = data?.dataSourceHealth.length ?? 0;

  return (
    <div className="min-h-screen bg-ocean-950 text-white font-mono">
      {/* Header */}
      <header className="h-14 bg-ocean-950/95 border-b border-ocean-800/80 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="font-extrabold tracking-widest text-white text-sm">ORCA COMMAND CENTER</span>
            <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
              PROTOTYPE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Updated {lastUpdated} IST</span>
            </div>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-2.5 py-1 rounded text-[10px] font-mono bg-cyan-900/40 border border-cyan-800/60 text-cyan-400 hover:bg-cyan-900/70 transition-all disabled:opacity-50"
          >
            {loading ? 'REFRESHING...' : 'REFRESH'}
          </button>
          <a href="/" className="px-2.5 py-1 rounded text-[10px] font-mono bg-ocean-900/60 border border-ocean-700 text-slate-400 hover:text-white transition-all">
            ← MAIN DASHBOARD
          </a>
        </div>
      </header>

      {error && (
        <div className="m-4 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
          ⚠ Command Center load error: {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
          <Activity className="w-4 h-4 mr-2 animate-pulse" />
          Loading maritime intelligence...
        </div>
      )}

      {data && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Alert Summary + Active Alerts */}
          <div className="lg:col-span-2 space-y-4">
            {/* Summary Row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'SEVERE', value: data.alertSummary.severe, color: '#ef4444' },
                { label: 'HIGH', value: data.alertSummary.high, color: '#f97316' },
                { label: 'MODERATE', value: data.alertSummary.moderate, color: '#f59e0b' },
                { label: 'INFO', value: data.alertSummary.info, color: '#94a3b8' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{ borderColor: item.color + '44' }}
                  className="bg-ocean-900/60 border rounded-xl p-3 text-center"
                >
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Active Alerts */}
            <div className="bg-ocean-900/50 border border-ocean-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white">
                    Active Maritime Alerts
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-400">
                    GDACS • LIVE
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">{totalAlerts} alert(s)</span>
              </div>

              {data.activeAlerts.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>No active alerts in Indian maritime region at this time.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {data.activeAlerts.map(alert => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-ocean-800/60 text-[10px] text-slate-500">
                Source: GDACS (UN OCHA / EU JRC) · IMD: OFFICIAL SOURCE NOT CONNECTED (requires credentials)
              </div>
            </div>

            {/* PFZ Status Notice */}
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-[11px] text-amber-300">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <span>⚠</span> PFZ Intelligence Status
              </div>
              <p>
                INCOIS PFZ (Potential Fishing Zone) data is currently <strong>DEMO only</strong>.
                INCOIS does not provide a public machine-readable API. For real PFZ advisories,
                visit <a href="https://incois.gov.in" target="_blank" rel="noopener noreferrer" className="underline">incois.gov.in</a> or use the SAMUDRA app.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-ocean-900/30 border border-ocean-800/40 rounded-xl p-3 text-[10px] text-slate-500">
              {data.disclaimer}
            </div>
          </div>

          {/* Right Column: Data Source Health */}
          <div className="space-y-4">
            <div className="bg-ocean-900/50 border border-ocean-800/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Data Pipeline Health</span>
                <span className="text-[9px] text-slate-400">({liveSourceCount}/{totalSourceCount} LIVE)</span>
              </div>
              <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
                {data.dataSourceHealth.map(source => (
                  <SourceRow key={source.id} source={source} />
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-ocean-900/50 border border-ocean-800/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Quick Status</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Open-Meteo Weather</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Open-Meteo Marine</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">GDACS Alerts</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">IMD Official</span>
                  <span className="text-orange-400">REQUIRES CREDS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">INCOIS PFZ</span>
                  <span className="text-amber-400">DEMO</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ORCA Risk Engine</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
