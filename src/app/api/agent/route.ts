/**
 * ORCA Conversational Agent API Route
 * POST /api/agent
 * Executes the True Specialized Multi-Agent Collaborative Pipeline.
 * 
 * Pipeline Flow:
 *   Planner Agent -> Task Graph -> Specialized Agents (Weather, Ocean, Geospatial, Risk, Alert, Fishing, Historical, Route) -> Evidence Agent -> Synthesis Agent
 * 
 * Server-side: all LLM calls, tool execution, and evidence collection happen here.
 * No API keys or secrets are exposed in the response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/agents/orchestrator';
import { detectLanguage } from '@/lib/agents/languageDetector';
import { sanitizeConversationState } from '@/lib/agents/conversationContext';
import {
  AgentResponse,
  ConversationState,
  UserPersona,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LENGTH = 1000;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // --- Input validation ---
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }

    const { message, conversationState: rawState, userRole } = body as {
      message?: unknown;
      conversationState?: unknown;
      userRole?: UserPersona;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Field "message" is required and must be a string' }, { status: 400 });
    }

    const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (trimmedMessage.length === 0) {
      return NextResponse.json({ error: 'Message must not be empty' }, { status: 400 });
    }

    // --- Sanitize conversation state from client (untrusted) ---
    const conversationState: ConversationState = sanitizeConversationState(rawState);

    // --- Detect language ---
    const detectedLanguage = detectLanguage(trimmedMessage);

    // --- Execute Collaborative Multi-Agent Pipeline ---
    const multiAgentResult = await agentOrchestrator.runCollaborativePipeline({
      message: trimmedMessage,
      conversationState,
      detectedLanguage,
      userRole: userRole || conversationState.userRole,
    });

    const plan = multiAgentResult.plan;
    const toolResults = multiAgentResult.toolResults;
    const riskAssessment = multiAgentResult.riskAssessment;

    // --- Map context: tell the UI what to update ---
    const mapContext = {
      updateMap: plan.location.resolvedFrom !== 'DEFAULT',
      coordinates: { latitude: plan.location.latitude, longitude: plan.location.longitude },
      locationName: plan.location.name,
      riskLevel: riskAssessment?.riskLevel,
      centerMap: plan.location.resolvedFrom === 'CITY_LOOKUP',
    };

    const processingTimeMs = Date.now() - startTime;

    const response: AgentResponse = {
      answer: multiAgentResult.answer,
      intent: plan.intent,
      confidence: plan.location.resolvedFrom === 'CITY_LOOKUP' ? 'HIGH' : plan.location.resolvedFrom === 'CONTEXT_CARRY' ? 'MEDIUM' : 'LOW',
      plan,
      toolResults: toolResults.map((r) => ({
        ...r,
        // Strip raw heavy risk data object from top-level toolResults — client receives structured riskAssessment separately
        data: r.tool === 'assessMarineRisk' ? undefined : r.data,
      })),
      evidence: multiAgentResult.evidence,
      riskAssessment,
      mapContext,
      conversationState: multiAgentResult.conversationState,
      detectedLanguage,
      processingTimeMs,
      suggestedQuestions: multiAgentResult.suggestedQuestions,
      agentExecution: multiAgentResult.agentResults.map((r) => ({
        agent: r.agentName,
        status: r.success ? ('completed' as const) : ('failed' as const),
        durationMs: r.executionTimeMs ?? 0,
      })),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[/api/agent] Unhandled multi-agent pipeline error:', message);
    return NextResponse.json(
      {
        error: 'Internal agent orchestration error',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
