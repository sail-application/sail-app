/**
 * lib/ai/methodology-context.ts
 *
 * Internal helpers that build the methodology section (Layer 2) of the
 * five-layer AI system prompt. Extracted from prompt-composer.ts to keep
 * both files under 200 lines.
 *
 * Exported functions:
 *   buildMethodologyContext       — single methodology → formatted string
 *   buildMultiMethodologyContext  — multiple methodologies → combined string
 *
 * These are consumed only by prompt-composer.ts — not part of the public API.
 */

import type { AiFeature } from '@/types/ai';
import type { Methodology } from '@/types/methodology';

/**
 * Builds the methodology context string (Layer 2) for a single methodology.
 * Adapts content depth based on feature latency requirements:
 *   - live-call: stages + question types only (minimal, targets <2s response)
 *   - practice/email: full context (stages, vocab, anti-patterns, success signals)
 *   - analyzer: full context + scoring rubric
 */
export function buildMethodologyContext(
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

  // Question types — omitted for live-call (too verbose for real-time)
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

  // Anti-patterns and success signals — for practice and analyzer only
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

  // Scoring rubric — only for analyzer (needs full dimension details)
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

/**
 * Builds a combined methodology context when multiple methodologies are active.
 * Each methodology gets its own labeled section so the AI can draw on each
 * framework distinctly. Overlapping vocabulary keys are deduplicated (first wins).
 */
export function buildMultiMethodologyContext(
  methodologies: Methodology[],
  feature: AiFeature,
): string {
  if (methodologies.length === 0) return '';
  if (methodologies.length === 1) return buildMethodologyContext(methodologies[0], feature);

  // Track vocabulary terms already defined to avoid duplicate definitions
  const seenVocab = new Set<string>();
  const parts: string[] = [];

  for (const methodology of methodologies) {
    const mParts: string[] = [];

    // Section header so the AI knows which framework is being applied
    mParts.push(`## Using ${methodology.name}:`);

    if (methodology.system_prompt_template) {
      mParts.push(methodology.system_prompt_template);
    }

    if (methodology.stages?.length > 0) {
      const stageText = methodology.stages
        .sort((a, b) => a.order - b.order)
        .map((s) => `${s.order}. ${s.name}: ${s.description}`)
        .join('\n');
      mParts.push(`### Stages\n${stageText}`);
    }

    if (feature !== 'live-call' && methodology.question_types?.length > 0) {
      const qtText = methodology.question_types
        .map((q) => `- **${q.name}**: ${q.purpose}`)
        .join('\n');
      mParts.push(`### Question Types\n${qtText}`);
    }

    // Only add vocabulary terms not already seen from a prior methodology
    if (methodology.vocabulary && Object.keys(methodology.vocabulary).length > 0) {
      const uniqueVocab = Object.entries(methodology.vocabulary).filter(
        ([term]) => !seenVocab.has(term),
      );
      uniqueVocab.forEach(([term]) => seenVocab.add(term));
      if (uniqueVocab.length > 0) {
        const vocabText = uniqueVocab
          .map(([term, def]) => `- **${term}**: ${def}`)
          .join('\n');
        mParts.push(`### Key Terminology\n${vocabText}`);
      }
    }

    if ((feature === 'practice' || feature === 'analyzer') && methodology.anti_patterns?.length > 0) {
      const apText = methodology.anti_patterns
        .map((ap) => `- **${ap.name}**: ${ap.description}`)
        .join('\n');
      mParts.push(`### Common Mistakes\n${apText}`);
    }

    parts.push(mParts.join('\n\n'));
  }

  return parts.join('\n\n---\n\n');
}
