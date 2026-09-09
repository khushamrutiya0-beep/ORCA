'use client';

import React, { useState } from 'react';
import { EvidenceItem } from '@/lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { ChevronDown, ChevronRight, Database, X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface EvidenceDrawerProps {
  evidenceList: EvidenceItem[];
  isOpen?: boolean;
  onClose?: () => void;
  locationName?: string;
  riskScore?: number;
}

const SOURCE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OFFICIAL:    { label: 'OFFICIAL', color: '#047857', bg: '#ecfdf5' },
  MODEL:       { label: 'MODEL',    color: '#0369a1', bg: '#f0f9ff' },
  OBSERVATION: { label: 'OBS',      color: '#6d28d9', bg: '#f5f3ff' },
  REFERENCE:   { label: 'REF',      color: '#0284c7', bg: '#f0f9ff' },
  DEMO:        { label: 'DEMO',     color: '#4338ca', bg: '#eef2ff' },
  UNAVAILABLE: { label: 'N/A',      color: '#475569', bg: '#f1f5f9' },
};

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  evidenceList,
  isOpen: isModalOpen,
  onClose,
  locationName,
  riskScore,
}) => {
  const [isInlineOpen, setIsInlineOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!evidenceList || evidenceList.length === 0) return null;

  // If used as modal
  if (isModalOpen !== undefined && onClose) {
    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Data Provenance & Source Evidence
                </h3>
                <p className="text-xs text-slate-500">
                  {locationName ? `${locationName} • ` : ''}{evidenceList.length} verified observation point(s)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
            {evidenceList.map((item, idx) => {
              const sourceTypeKey = (item as unknown as { sourceType?: string }).sourceType ?? 'MODEL';
              const stCfg = SOURCE_TYPE_CONFIG[sourceTypeKey] ?? SOURCE_TYPE_CONFIG.MODEL;
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id || idx} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} size="sm" />
                      <span
                        style={{ color: stCfg.color, background: stCfg.bg }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-current"
                      >
                        {stCfg.label}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{item.provider}</span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Source: <strong className="text-slate-600">{item.source}</strong></span>
                    {item.rawMetrics && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        {isExpanded ? 'Hide Raw JSON' : 'Inspect Raw Metrics'}
                      </button>
                    )}
                  </div>

                  {isExpanded && item.rawMetrics && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono text-slate-700">
                      <pre>{JSON.stringify(item.rawMetrics, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Strict Grounding Guarantee
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Inline collapsible view
  return (
    <div className="mt-3 border-t border-slate-100 pt-2.5">
      <button
        onClick={() => setIsInlineOpen(!isInlineOpen)}
        className="flex items-center justify-between w-full py-1 text-xs text-blue-600 hover:text-blue-700 transition-colors font-semibold"
      >
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          <span>Verified Evidence & Sources ({evidenceList.length})</span>
        </div>
        {isInlineOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {isInlineOpen && (
        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
          {evidenceList.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} size="sm" />
                  <span className="font-bold text-slate-800">{item.provider}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-600">{item.summary}</p>
              <div className="text-[10px] text-slate-400">
                Source: <strong className="text-slate-600">{item.source}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
