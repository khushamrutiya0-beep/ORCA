/**
 * ORCA LLM Provider Factory
 * Returns Gemini if GOOGLE_GENERATIVE_AI_API_KEY is configured, otherwise deterministic fallback.
 * All LLM calls must happen server-side — never in frontend code.
 */

import { ILLMProvider } from './ILLMProvider';

export type { ILLMProvider } from './ILLMProvider';
export { DeterministicLLMProvider } from './deterministicProvider';
export { GeminiLLMProvider } from './geminiProvider';

let _provider: ILLMProvider | null = null;

export function getLLMProvider(): ILLMProvider {
  if (_provider) return _provider;

  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (geminiKey && geminiKey.trim().length > 10) {
    const { GeminiLLMProvider } = require('./geminiProvider');
    _provider = new GeminiLLMProvider(geminiKey.trim());
    console.log('[ORCA LLM] Using Gemini provider (gemini-2.0-flash)');
  } else {
    const { DeterministicLLMProvider } = require('./deterministicProvider');
    _provider = new DeterministicLLMProvider();
    console.log('[ORCA LLM] No LLM API key found — using deterministic fallback provider');
  }

  return _provider!;
}
