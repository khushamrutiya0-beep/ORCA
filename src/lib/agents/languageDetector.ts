/**
 * ORCA Language Detector
 * Lightweight detection using Unicode script ranges + keyword heuristics.
 * No external API required — purely character-set based.
 */

import { DetectedLanguage } from '../types';

// Devanagari Unicode range: U+0900 – U+097F
const DEVANAGARI_RANGE = /[\u0900-\u097F]/;
// Gujarati Unicode range: U+0A80 – U+0AFF
const GUJARATI_RANGE = /[\u0A80-\u0AFF]/;

export function detectLanguage(text: string): DetectedLanguage {
  if (GUJARATI_RANGE.test(text)) return 'gu';
  if (DEVANAGARI_RANGE.test(text)) return 'hi';
  return 'en';
}
