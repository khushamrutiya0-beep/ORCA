'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Coordinates,
  ChatMessage,
  EvidenceItem,
  AgentResponse,
  ConversationState,
  AgentStep,
  RiskAssessment,
} from '@/lib/types';
import { Bot, Send, Sparkles, User, AlertCircle, Compass, CheckCircle2, Loader2, ChevronDown, RefreshCw, MessageSquare, Layers, ShieldCheck, Database } from 'lucide-react';
import { EvidenceDrawer } from './EvidenceDrawer';
import { StatusBadge } from '../ui/StatusBadge';

interface ChatPanelProps {
  currentCoordinates: Coordinates;
  locationName?: string;
  onLocationChange?: (coords: Coordinates, name?: string) => void;
  onRiskAssessmentUpdate?: (assessment: RiskAssessment) => void;
}

const INITIAL_STATE: ConversationState = {
  messageCount: 0,
  sessionStartedAt: new Date().toISOString(),
};

const WELCOME_MSG: ChatMessage = {
  id: 'msg-welcome',
  sender: 'ORCA_AGENT',
  content: `Welcome to **ORCA Multi-Agent Marine Intelligence** — Collaborative decision support for Indian waters.

I orchestrate verified live telemetry from Open-Meteo, GDACS multi-hazard disaster alerts, and satellite convergence proxies through our deterministic risk calculation engine.

**Common Operational Questions:**
- **Sea safety assessment** — *"Is it safe to go fishing tomorrow morning from Kochi?"*
- **Wave & swell conditions** — *"What are the waves near Mumbai?"*
- **Tide information** — *"What are the tides near Kochi tomorrow?"*
- **Safest sea-only route** — *"What is the safest route from Porbandar to Mumbai?"*
- **Protected marine zones** — *"What areas should I avoid near Kochi?"*
- **Marine productivity** — *"Which regions have high chlorophyll and favourable SST?"*

*Supports Hindi (हिन्दी) and Gujarati (ગુજરાતી) naturally.*`,
  timestamp: new Date().toISOString(),
};

const SUGGESTED_QUERIES = [
  '🎣 Is it safe to go fishing tomorrow morning from Kochi?',
  '🌊 What about the waves near Mumbai?',
  '🧭 What is the safest route from Porbandar to Mumbai?',
  '🟢 Which regions have high chlorophyll and favourable SST?',
  '🗺️ What marine protected areas should I avoid near Kochi?',
  '🌪️ Are there any cyclone or disaster alerts active?',
  '⚓ Where is the nearest shelter port?',
  '🇮🇳 क्या कल सुबह कोच्चि के पास समुद्र की स्थिति ठीक है?',
  '🇮🇳 કાલે સવારે પોરબંદર પાસે દરિયાની સ્થિતિ કેવી રહેશે?',
];

function StepIcon({ status }: { status: AgentStep['status'] }) {
  if (status === 'COMPLETED') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === 'RUNNING') return <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />;
  if (status === 'FAILED') return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
  if (status === 'SKIPPED') return <span className="w-3.5 h-3.5 text-slate-500">—</span>;
  return <span className="w-2.5 h-2.5 rounded-full border border-slate-600" />;
}

function RenderContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        if (!line.trim()) {
          return <div key={idx} className="h-1" />;
        }

        // Heading ## or ###
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="font-extrabold text-slate-900 text-xs sm:text-sm mt-2.5 tracking-tight uppercase text-blue-900">{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="font-extrabold text-slate-900 text-sm sm:text-base mt-3 tracking-tight">{line.replace('## ', '')}</h3>;
        }

        // Bullet point
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const bulletText = line.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-sky-600 font-bold text-sm">•</span>
              <div className="flex-1">{renderInline(bulletText)}</div>
            </div>
          );
        }

        // Blockquote >
        if (line.startsWith('> ')) {
          return (
            <div key={idx} className="border-l-3 border-sky-500 pl-3 py-1 my-1.5 text-slate-700 italic bg-sky-50/60 rounded-r-lg text-xs leading-relaxed">
              {renderInline(line.replace('> ', ''))}
            </div>
          );
        }

        return <p key={idx}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="text-slate-600 italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  currentCoordinates,
  locationName,
  onLocationChange,
  onRiskAssessmentUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>(INITIAL_STATE);
  const [activeSteps, setActiveSteps] = useState<AgentStep[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<{ list: EvidenceItem[]; title: string; riskScore?: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeSteps, scrollToBottom]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'USER',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setActiveSteps([
      { agentRole: 'PLANNER', stepName: 'Parsing marine query & intent', status: 'RUNNING' },
    ]);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          coordinates: currentCoordinates,
          locationName,
          conversationState,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent returned HTTP ${response.status}`);
      }

      const agentData: AgentResponse = await response.json();

      if (agentData.conversationState) {
        setConversationState(agentData.conversationState);
      }

      if (agentData.plan?.location && onLocationChange) {
        const { latitude, longitude, name } = agentData.plan.location;
        if (
          Math.abs(latitude - currentCoordinates.latitude) > 0.01 ||
          Math.abs(longitude - currentCoordinates.longitude) > 0.01
        ) {
          onLocationChange({ latitude, longitude }, name);
        }
      }

      const riskToolResult = agentData.toolResults?.find((r) => r.tool === 'assessMarineRisk');
      if (riskToolResult?.data && onRiskAssessmentUpdate) {
        onRiskAssessmentUpdate(riskToolResult.data as RiskAssessment);
      }

      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'ORCA_AGENT',
        content: agentData.answer,
        timestamp: new Date().toISOString(),
        evidence: agentData.evidence,
        stepsExecuted: agentData.plan?.steps,
      };

      setActiveSteps(agentData.plan?.steps || []);
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      console.error('Agent error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'ORCA_AGENT',
        content: `⚠️ Communication error: ${err.message || 'Could not connect to ORCA multi-agent pipeline.'}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearSession = () => {
    setMessages([WELCOME_MSG]);
    setConversationState(INITIAL_STATE);
    setActiveSteps([]);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-3.5 px-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight">
                ORCA Multi-Agent Intelligence Assistant
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono-data">
              8 SPECIALIZED AGENTS • DETERMINISTIC REASONING
            </p>
          </div>
        </div>

        <button
          onClick={handleClearSession}
          className="text-xs text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
          title="Reset conversation context"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline font-medium">Reset Context</span>
        </button>
      </div>

      {/* Suggested Quick Query Chips */}
      <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Quick Queries:</span>
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-[11px] font-semibold whitespace-nowrap px-3 py-1 rounded-full bg-white hover:bg-sky-50 border border-slate-200/90 hover:border-sky-300 text-slate-700 hover:text-sky-700 shadow-2xs transition-all shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'ORCA_AGENT';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                  isAgent
                    ? 'bg-slate-900 text-sky-400 border border-slate-800'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[90%] sm:max-w-[80%] space-y-2 ${isAgent ? '' : 'text-right'}`}>
                <div
                  className={`p-4 rounded-2xl ${
                    isAgent
                      ? 'bg-white border border-slate-200/90 text-slate-900 shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                  }`}
                >
                  {isAgent ? (
                    <RenderContent content={msg.content} />
                  ) : (
                    <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* Evidence trigger button if available */}
                {isAgent && msg.evidence && msg.evidence.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        setSelectedEvidence({
                          list: msg.evidence!,
                          title: 'Response Evidence & Data Provenance Chain',
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-700 hover:text-sky-800 px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors shadow-2xs"
                    >
                      <Database className="w-3.5 h-3.5 text-sky-600" />
                      <span>Inspect {msg.evidence.length} Verified Data Sources</span>
                    </button>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 px-1 font-mono-data">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Step Progress Indicator while thinking */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-sky-400 border border-slate-800 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs max-w-md space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span>Multi-Agent Reasoning Pipeline Active...</span>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                {activeSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                    <StepIcon status={step.status} />
                    <span className="font-mono-data font-bold text-slate-800">[{step.agentRole}]</span>
                    <span className="truncate">{step.stepName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-white border-t border-slate-200/90 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about sea safety, waves, weather, tides, or routes..."
            disabled={isLoading}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
          />
        </div>

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="p-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 border border-slate-800"
          title="Send query"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          ) : (
            <Send className="w-4 h-4 text-sky-400" />
          )}
        </button>
      </div>

      {/* Evidence Drawer Modal */}
      {selectedEvidence && (
        <EvidenceDrawer
          isOpen={Boolean(selectedEvidence)}
          onClose={() => setSelectedEvidence(null)}
          evidenceList={selectedEvidence.list}
          locationName={locationName || 'Indian Coastal Waters'}
          riskScore={selectedEvidence.riskScore}
        />
      )}
    </div>
  );
};
