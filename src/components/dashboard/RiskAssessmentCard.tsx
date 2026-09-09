'use client';

import React, { useState } from 'react';
import { RiskAssessment, RiskLevel } from '@/lib/types';
import { EvidenceDrawer } from '../chat/EvidenceDrawer';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Anchor, 
  Compass, 
  Clock, 
  Info, 
  ExternalLink,
  HelpCircle,
  Waves,
  Wind,
  Zap,
  ChevronRight,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface RiskAssessmentCardProps {
  assessment: RiskAssessment | null;
  isLoading?: boolean;
  selectedTimeWindow: 'current' | 'tomorrow_morning';
  onTimeWindowChange: (window: 'current' | 'tomorrow_morning') => void;
  onOpenEvidence?: () => void;
}

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  assessment,
  isLoading = false,
  selectedTimeWindow,
  onTimeWindowChange,
  onOpenEvidence,
}) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const [showHazardWarnings, setShowHazardWarnings] = useState(false);
  const [showContributingFactors, setShowContributingFactors] = useState(false);

  if (isLoading || !assessment) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-slate-100 rounded-md w-1/3" />
          <div className="h-6 bg-slate-100 rounded-lg w-1/4" />
        </div>
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  const getRiskBadgeConfig = (level: RiskLevel) => {
    switch (level) {
      case 'LOW':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badgeText: 'LOW OPERATIONAL RISK',
          icon: ShieldCheck,
          accentColor: '#10b981',
          meterBg: 'bg-emerald-500',
          cardBorder: 'border-l-4 border-l-emerald-500 border-slate-200/90',
          circleStroke: 'text-emerald-500',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badgeText: 'MODERATE RISK (MONITOR)',
          icon: AlertTriangle,
          accentColor: '#f59e0b',
          meterBg: 'bg-amber-500',
          cardBorder: 'border-l-4 border-l-amber-500 border-slate-200/90',
          circleStroke: 'text-amber-500',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-800',
          badgeText: 'HIGH RISK (CAUTION)',
          icon: ShieldAlert,
          accentColor: '#f97316',
          meterBg: 'bg-orange-500',
          cardBorder: 'border-l-4 border-l-orange-500 border-slate-200/90',
          circleStroke: 'text-orange-500',
        };
      case 'SEVERE':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          badgeText: 'SEVERE MARITIME HAZARD',
          icon: Zap,
          accentColor: '#ef4444',
          meterBg: 'bg-rose-500',
          cardBorder: 'border-l-4 border-l-rose-500 border-slate-200/90',
          circleStroke: 'text-rose-500',
        };
      case 'UNKNOWN':
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          badgeText: 'DATA UNAVAILABLE',
          icon: HelpCircle,
          accentColor: '#64748b',
          meterBg: 'bg-slate-400',
          cardBorder: 'border-l-4 border-l-slate-400 border-slate-200/90',
          circleStroke: 'text-slate-400',
        };
    }
  };

  const badgeConfig = getRiskBadgeConfig(assessment.riskLevel);
  const RiskIcon = badgeConfig.icon;

  const getFactorLevelBadge = (level: RiskLevel) => {
    switch (level) {
      case 'LOW':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold font-mono">LOW</span>;
      case 'MODERATE':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold font-mono">MODERATE</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold font-mono">HIGH</span>;
      case 'SEVERE':
        return <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold font-mono">SEVERE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium font-mono">N/A</span>;
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-xs hover:shadow-subtle transition-all duration-200 space-y-4 ${badgeConfig.cardBorder}`}>
      {/* Header & Forecast Time Window Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-sky-400 border border-slate-800 flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
              Deterministic Safety Assessment
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Window: <span className="text-blue-600 font-semibold">{assessment.timeLabel}</span>
            </span>
          </div>
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-medium border border-slate-200/60 shadow-2xs">
          <button
            onClick={() => onTimeWindowChange('current')}
            className={`px-3 py-1 rounded-lg transition-all ${
              selectedTimeWindow === 'current'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current State
          </button>
          <button
            onClick={() => onTimeWindowChange('tomorrow_morning')}
            className={`px-3 py-1 rounded-lg transition-all ${
              selectedTimeWindow === 'tomorrow_morning'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tomorrow Morning
          </button>
        </div>
      </div>

      {/* Main Score & Risk Banner (High Visual Prominence) */}
      <div className="flex flex-col gap-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
        {/* Risk Level Pill & Advisory */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide border shadow-2xs ${badgeConfig.bg}`}
            >
              <RiskIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{badgeConfig.badgeText}</span>
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {assessment.recommendation}
          </p>
        </div>

        {/* Score Gauge Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs w-full space-y-3">
          {/* Top Row: Headings */}
          <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span className="truncate">RISK SCORE</span>
            <span className="truncate text-right">SAFETY INDEX</span>
          </div>

          {/* Middle Row: Score Values */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            {/* Left: Risk Score with large number and /100 side-by-side */}
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-mono-data leading-none">
                {assessment.riskScore}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-400 font-mono-data">
                /100
              </span>
            </div>

            {/* Right: Safety Percentage & Status Badge stacked cleanly */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-mono-data leading-none">
                {assessment.safetyScore}%
              </span>
              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono-data uppercase tracking-wider ${
                assessment.riskLevel === 'LOW'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : assessment.riskLevel === 'MODERATE'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : assessment.riskLevel === 'HIGH'
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : assessment.riskLevel === 'SEVERE'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                {assessment.riskLevel === 'LOW' ? 'Safe' : assessment.riskLevel === 'MODERATE' ? 'Moderate' : assessment.riskLevel === 'HIGH' ? 'Caution' : assessment.riskLevel === 'SEVERE' ? 'Hazardous' : 'Safe'}
              </span>
            </div>
          </div>

          {/* Bottom Row: Full-width Progress Bar */}
          <div className="space-y-1 pt-0.5">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${badgeConfig.meterBg}`}
                style={{ width: `${Math.max(5, Math.min(100, assessment.riskScore))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 font-mono-data px-0.5">
              <span>0 (CALM)</span>
              <span>50</span>
              <span>100 (HAZARD)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings if any (Collapsible) */}
      {assessment.warnings && assessment.warnings.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200/90 rounded-xl overflow-hidden transition-all text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setShowHazardWarnings(!showHazardWarnings)}
            className="w-full p-2.5 px-3.5 flex items-center justify-between text-rose-900 hover:bg-rose-100/60 transition-colors font-bold text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
              <span className="truncate">
                {assessment.warnings.length} Active Hazard Advisory Warning{assessment.warnings.length > 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-[11px] font-bold text-rose-700 hover:text-rose-900 shrink-0 pl-2">
              {showHazardWarnings ? 'Collapse ↑' : 'View Details →'}
            </span>
          </button>

          {showHazardWarnings && (
            <div className="p-3.5 pt-1 text-rose-900 space-y-2 border-t border-rose-200/70 animate-in fade-in duration-150">
              {assessment.warnings.map((w, idx) => (
                <div key={idx} className="text-rose-800 pl-2 text-xs leading-relaxed flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contributing Factors & Vessel Matrix (Collapsible Summary) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <span className="text-slate-800 font-bold truncate">
              Contributing Factors ({assessment.factors?.length || 0} evaluated parameters)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowContributingFactors(!showContributingFactors)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0 pl-2 flex items-center gap-1 transition-colors"
          >
            <span>{showContributingFactors ? 'Collapse ↑' : 'View Factors →'}</span>
          </button>
        </div>

        {showContributingFactors && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Contributing Factors Breakdown Table */}
            <div className="border border-slate-200/90 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {assessment.factors && assessment.factors.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-0 sm:pr-2 w-full sm:w-auto">
                    <span className="text-sky-600 font-bold text-xs mt-0.5">•</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        {f.label}
                      </span>
                      <span className="text-[11px] text-slate-500 block break-words sm:truncate font-medium">
                        {f.reason}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1.5 sm:pt-0 border-t border-slate-100 sm:border-t-0">
                    <span className="font-mono-data text-xs font-bold text-slate-800">
                      {f.value !== null ? String(f.value) : 'N/A'} {f.unit}
                    </span>
                    {getFactorLevelBadge(f.level)}
                  </div>
                </div>
              ))}
            </div>

            {/* Vessel Category Suitability */}
            {assessment.vesselAdvisory && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Vessel Category Suitability Matrix
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className={`p-2.5 rounded-xl border font-medium ${assessment.vesselAdvisory.smallCraftCaution ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                    <div className="font-bold">Small Craft (&lt;8m)</div>
                    <div className="font-bold mt-0.5">{assessment.vesselAdvisory.smallCraftCaution ? '⚠️ CAUTION' : '✅ LOW RISK'}</div>
                  </div>
                  <div className={`p-2.5 rounded-xl border font-medium ${assessment.vesselAdvisory.motorizedCraftCaution ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                    <div className="font-bold">Motorized (8-15m)</div>
                    <div className="font-bold mt-0.5">{assessment.vesselAdvisory.motorizedCraftCaution ? '⚠️ CAUTION' : '✅ LOW RISK'}</div>
                  </div>
                  <div className={`p-2.5 rounded-xl border font-medium ${assessment.vesselAdvisory.deepSeaVesselCaution ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                    <div className="font-bold">Deep Sea (&gt;15m)</div>
                    <div className="font-bold mt-0.5">{assessment.vesselAdvisory.deepSeaVesselCaution ? '⛔ RESTRICTED' : '✅ OPERATIONAL'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nearest Safe Port & Evidence Action */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {assessment.nearestPort ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Anchor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Nearest Shelter Port: <strong className="text-slate-900">{assessment.nearestPort.portName}</strong> (~{assessment.nearestPort.distanceKm} km / {assessment.nearestPort.distanceNM} NM)
            </span>
          </div>
        ) : (
          <div className="text-slate-400 text-xs font-mono-data">Port proximity calculating...</div>
        )}

        <button
          onClick={() => {
            if (onOpenEvidence) onOpenEvidence();
            else setShowEvidence(true);
          }}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto transition-colors"
        >
          <span>View Source Evidence</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Evidence Drawer Modal */}
      {showEvidence && assessment.evidence && (
        <EvidenceDrawer
          isOpen={showEvidence}
          onClose={() => setShowEvidence(false)}
          evidenceList={assessment.evidence}
          locationName="Selected Maritime Sector"
          riskScore={assessment.riskScore}
        />
      )}
    </div>
  );
};
