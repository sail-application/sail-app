/**
 * lib/ai/prompt-composer.ts
 *
 * Five-layer prompt composition for methodology-aware AI coaching.
 * Replaces all hardcoded system prompts with dynamic, methodology-specific
 * prompts that work identically across all LLM providers.
 *
 * Layers:
 *   1. Base Identity    → "You are a sales coaching AI for SAIL..."
 *   2. Methodology      → system_prompt_template + stages + question_types
 *   3. Feature-Specific → feature_prompt_overrides[feature] OR default
 *   4. User Context     → proficiency level adaptation
 *   5. Session Context  → current transcript/scenario (caller provides)
 *
 * Output is standard AiMessage[] that any provider can consume.
 */

import type { AiMessage, AiFeature } from '@/types/ai';
import type { Methodology } from '@/types/methodology';

/* ──────────────── Base Identity (Layer 1) ──────────────── */

const BASE_IDENTITY = `You are SAIL, a sales coaching AI for volume photography businesses. You help sales representatives improve their selling skills through practice, real-time coaching, email composition, and call analysis. Your expertise is in B2B sales for services like school photography, dance studio photos, sports team photos, and daycare picture days. Always be encouraging, specific, and actionable in your coaching.`;

/* ──────────────── Feature Defaults (Layer 3 fallback) ──────────────── */

const FEATURE_DEFAULTS: Record<AiFeature, string> = {
  'live-call': 'You are providing real-time coaching during an active sales call. Be extremely concise — max 1-2 sentences. Focus on the most impactful suggestion right now.',
  practice: 'You are roleplaying as a prospect in a practice sales call. Stay in character. After the session, provide detailed feedback on strengths and areas for improvement.',
  email: 'You are helping compose a professional sales outreach email. Focus on personalization, value proposition, and a clear call-to-action.',
  analyzer: 'You are analyzing a completed sales call recording. Provide a detailed scorecard with specific examples from the transcript. Be constructive and actionable.',
  strategies: 'You are explaining a sales methodology technique. Be clear, use examples relevant to volume photography sales, and suggest how to practice.',
};

/* ──────────────── Proficiency Templates (Layer 4) ──────────────── */

const PROFICIENCY_INSTRUCTIONS: Record<string, string> = {
  beginner: 'The user is a beginner. Provide verbatim example phrases they can use. Be very specific and prescriptive. Walk them through each step.',
  intermediate: 'The user has intermediate experience. Provide strategic guidance with context. Explain the "why" behind techniques, not just the "what".',
  advanced: 'The user is advanced. Provide high-level strategic insights. Focus on nuance, pattern recognition, and adapting techniques to specific situations.',
};

/* ──────────────── Public API ──────────────── */

/**
 * Composes methodology-aware system messages for an AI call.
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
  if (featurePrompt) {
    parts.push(featurePrompt);
  }

  // Layer 4: Proficiency adaptation
  const proficiencyPrompt = PROFICIENCY_INSTRUCTIONS[proficiencyLevel]
    ?? PROFICIENCY_INSTRUCTIONS.beginner;
  parts.push(proficiencyPrompt);

  return [{ role: 'system', content: parts.join('\n\n') }];
}

/* ──────────────── Internal Helpers ──────────────── */

/**
 * Builds the methodology context string (Layer 2).
 * Adapts content depth based on feature latency requirements:
 *   - live-call: stages + question types only (minimal for <2s)
 *   - practice/email: full context
 *   - analyzer: full context + scoring rubric
 */
function buildMethodologyContext(
  methodology: Methodology,
  feature: AiFeature,
): string {
  const parts: string[] = [];

  // Always include the methodology's system prompt template
  if (methodology.system_prompt_template) {
    parts.push(methodology.system_prompt_template);
  }

  // Stages — always included (core of every methodology)
  if (methodology.stages?.length > 0) {
    const stageText = methodology.stages
      .sort((a, b) => a.order - b.order)
      .map((s) => `${s.order}. ${s.name}: ${s.description}`)
      .join('\n');
    parts.push(`## Methodology Stages\n${stageText}`);
  }

  // Question types — included for all features except live-call (too verbose)
  if (feature !== 'live-call' && methodology.question_types?.length > 0) {
    const qtText = methodology.question_types
      .map((q) => `- **${q.name}**: ${q.purpose}`)
      .join('\n');
    parts.push(`## Question Types\n${qtText}`);
  }

  // Vocabulary — helps AI use correct methodology-specific terms
  if (methodology.vocabulary && Object.keys(methodology.vocabulary).length > 0) {
    const vocabText = Object.entries(methodology.vocabulary)
      .map(([term, def]) => `- **${term}**: ${def}`)
      .join('\n');
    parts.push(`## Key Terminology\n${vocabText}`);
  }

  // Anti-patterns and success signals — for practice and analyzer
  if (feature === 'practice' || feature === 'analyzer') {
    if (methodology.anti_patterns?.length > 0) {
      const apText = methodology.anti_patterns
        .map((ap) => `- **${ap.name}**: ${ap.description}`)
        .join('\n');
      parts.push(`## Common Mistakes to Watch For\n${apText}`);
    }

    if (methodology.success_signals?.length > 0) {
      const ssText = methodology.success_signals
        .map((ss) => `- **${ss.name}**: ${ss.description}`)
        .join('\n');
      parts.push(`## Positive Signals to Reinforce\n${ssText}`);
    }
  }

  // Scoring rubric — only for analyzer (needs dimension details)
  if (feature === 'analyzer' && methodology.scoring_rubric?.length > 0) {
    const rubricText = methodology.scoring_rubric
      .map((d) => `- **${d.name}** (weight: ${d.weight}): ${d.description}`)
      .join('\n');
    parts.push(
      `## Scoring Rubric\nRate each dimension 1-10 with evidence from the transcript:\n${rubricText}`,
    );
  }

  return parts.join('\n\n');
}
