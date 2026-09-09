/**
 * ORCA LLM Provider Interface
 * Abstraction layer — allows switching between Gemini, OpenAI, Anthropic, or deterministic fallback.
 * The LLM is NEVER used to invent marine data — only for intent parsing and response synthesis.
 */

import { AgentPlan, ConversationState, DetectedLanguage, ToolResult } from '../types';

export interface PlannerInput {
  message: string;
  conversationState?: ConversationState;
  detectedLanguage: DetectedLanguage;
}

export interface SynthesizerInput {
  originalMessage: string;
  plan: AgentPlan;
  toolResults: ToolResult[];
  detectedLanguage: DetectedLanguage;
  conversationState?: ConversationState;
}

export interface ILLMProvider {
  readonly name: string;
  readonly isLive: boolean; // false = deterministic fallback
  /**
   * Parse user intent, resolve location and time from the message.
   * Returns a structured AgentPlan — NEVER invents marine values.
   */
  planIntent(input: PlannerInput): Promise<AgentPlan>;

  /**
   * Synthesize a human-readable response grounded in tool results.
   * Must only cite values that appear in toolResults — no fabrication.
   */
  synthesizeResponse(input: SynthesizerInput): Promise<string>;
}
