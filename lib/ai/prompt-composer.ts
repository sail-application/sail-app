/**
 * lib/ai/prompt-composer.ts
 *
 * Public API for five-layer methodology-aware prompt composition.
 * Build helpers (Layer 2) live in methodology-context.ts to keep this file
 * under the 200-line limit.
 *
 * Layers:
 *   1. Base Identity    → "You are SAIL, a conversation coaching AI..."
 *   1b. Context Pack    → industry overlay appended to base identity
 *   2. Methodology      → system_prompt_template + stages + question_types
 *   3. Feature-Specific → feature_prompt_overrides[feature] OR default
 *   4. User Context     → proficiency level adaptation
 *   5. Session Context  → current transcript/scenario (caller provides)
 *
 * Output is standard AiMessage[] that any provider can consume.
 */

import type { AiMessage, AiFeature } from '@/types/ai';
import type { Methodology } from '@/types/methodology';
import {
  buildMethodologyContext,
  buildMultiMethodologyContext,
} from './methodology-context';

/* ──────────────── Layer 1: Base Identity ──────────────── */

const BASE_IDENTITY = `You are SAIL, a conversation coaching AI. You help professionals improve their communication skills through practice, real-time coaching, email composition, and conversation analysis. You adapt to any industry or context — from B2B sales to negotiations to personal conversations. Always be encouraging, specific, and actionable.`;

/* ──────────────── Layer 3: Feature Defaults (fallback) ──────────────── */

const FEATURE_DEFAULTS: Record<AiFeature, string> = {
  'live-call': 'You are providing real-time coaching during an active sales call. Be extremely concise — max 1-2 sentences. Focus on the most impactful suggestion right now.',
  practice: 'You are roleplaying as a prospect in a practice sales call. Stay in character. After the session, provide detailed feedback on strengths and areas for improvement.',
  email: 'You are helping compose a professional sales outreach email. Focus on personalization, value proposition, and a clear call-to-action.',
  analyzer: 'You are analyzing a completed sales call recording. Provide a detailed scorecard with specific examples from the transcript. Be constructive and actionable.',
  strategies: 'You are explaining a coaching methodology or technique. Be clear, use relevant examples, and suggest how to practice.',
};

/* ──────────────── Layer 4: Proficiency Templates ──────────────── */

const PROFICIENCY_INSTRUCTIONS: Record<string, string> = {
  beginner: 'The user is a beginner. Provide verbatim example phrases they can use. Be very specific and prescriptive. Walk them through each step.',
  intermediate: 'The user has intermediate experience. Provide strategic guidance with context. Explain the "why" behind techniques, not just the "what".',
  advanced: 'The user is advanced. Provide high-level strategic insights. Focus on nuance, pattern recognition, and adapting techniques to specific situations.',
};

/* ──────────────── Public API ──────────────── */

/**
 * Composes methodology-aware system messages for a single-methodology AI call.
 * Returns AiMessage[] with system messages that any provider can consume.
 *
 * @param feature - Which SAIL feature is making the call
 * @param methodology - The resolved methodology (null = generic coaching)
 * @param proficiencyLevel - User's skill level with this methodology
 * @returns Array of system messages to prepend to the conversation
 */
export function composeSystemPrompt(
  feature: AiFeature,
  methodology: Methodology | null,
  proficiencyLevel: string = 'beginner',
): AiMessage[] {
  const parts: string[] = [];

  // Layer 1: Base identity
  parts.push(BASE_IDENTITY);

  // Layer 2: Methodology context
  if (methodology) {
    parts.push(buildMethodologyContext(methodology, feature));
  }

  // Layer 3: Feature-specific instructions
  const featurePrompt = methodology?.feature_prompt_overrides?.[feature]
    ?? FEATURE_DEFAULTS[feature]
    ?? '';
  if (featurePrompt) parts.push(featurePrompt);

  // Layer 4: Proficiency adaptation
  parts.push(PROFICIENCY_INSTRUCTIONS[proficiencyLevel] ?? PROFICIENCY_INSTRUCTIONS.beginner);

  return [{ role: 'system', content: parts.join('\n\n') }];
}

/**
 * Composes a system prompt when multiple methodologies are active simultaneously.
 * Combines all methodology contexts with clear section headers so the AI can
 * draw on each framework appropriately.
 *
 * @param feature - Which SAIL feature is making the call
 * @param methodologies - Array of resolved methodologies (empty = generic coaching)
 * @param proficiencyLevel - User's skill level
 * @param contextPack - Optional industry overlay injected into Layers 1b + vocabulary
 * @returns Array of system messages to prepend to the conversation
 */
export function composeMultiMethodologyPrompt(
  feature: AiFeature,
  methodologies: Methodology[],
  proficiencyLevel: string = 'beginner',
  contextPack?: { identity_overlay?: string; vocabulary_overlay?: Record<string, string> } | null,
): AiMessage[] {
  const parts: string[] = [];

  // Layer 1: Base identity
  parts.push(BASE_IDENTITY);

  // Layer 1b: Context pack identity overlay (e.g., "You are coaching a B2B SaaS rep...")
  if (contextPack?.identity_overlay) {
    parts.push(contextPack.identity_overlay);
  }

  // Layer 2: Combined methodology context (single-method path used when only one active)
  if (methodologies.length > 0) {
    parts.push(buildMultiMethodologyContext(methodologies, feature));
  }

  // Context pack vocabulary — merged after methodology vocabulary to avoid duplicates
  if (contextPack?.vocabulary_overlay && Object.keys(contextPack.vocabulary_overlay).length > 0) {
    const vocabText = Object.entries(contextPack.vocabulary_overlay)
      .map(([term, def]) => `- **${term}**: ${def}`)
      .join('\n');
    parts.push(`## Industry Terminology\n${vocabText}`);
  }

  // Layer 3: Feature-specific instructions (uses first methodology's overrides, or default)
  const primaryMethodology = methodologies[0] ?? null;
  const featurePrompt = primaryMethodology?.feature_prompt_overrides?.[feature]
    ?? FEATURE_DEFAULTS[feature]
    ?? '';
  if (featurePrompt) parts.push(featurePrompt);

  // Layer 4: Proficiency adaptation
  parts.push(PROFICIENCY_INSTRUCTIONS[proficiencyLevel] ?? PROFICIENCY_INSTRUCTIONS.beginner);

  return [{ role: 'system', content: parts.join('\n\n') }];
}
