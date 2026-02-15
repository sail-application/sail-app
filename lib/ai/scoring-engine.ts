/**
 * lib/ai/scoring-engine.ts
 *
 * Rubric-driven weighted scoring engine for methodology assessments.
 *
 * Design principle: AI does qualitative assessment (scores 1-10 per
 * dimension with evidence quotes). The application does the math
 * (weighted aggregation). This separation exists because LLMs are
 * unreliable at arithmetic but excellent at qualitative judgment.
 *
 * The scoring rubric is loaded from the methodology's `scoring_rubric`
 * JSONB column at runtime — no hardcoded scoring logic.
 */

import type { ScoringDimension } from '@/types/methodology';

/* ──────────────── Types ──────────────── */

/** Raw AI output for a single scoring dimension */
export interface DimensionScore {
  /** Must match a key in the methodology's scoring_rubric */
  key: string;
  /** AI-assigned score between 1 and 10 */
  score: number;
  /** Evidence quote or explanation from the AI */
  evidence: string;
}

/** Final computed score result */
export interface ScoringResult {
  /** Weighted total score (0-100 scale) */
  overall_score: number;
  /** Per-dimension scores with weights applied */
  dimension_scores: {
    key: string;
    name: string;
    raw_score: number;
    weighted_score: number;
    weight: number;
    evidence: string;
  }[];
  /** Whether all rubric dimensions were covered */
  is_complete: boolean;
  /** Dimensions missing from AI output (if any) */
  missing_dimensions: string[];
}

/* ──────────────── Public API ──────────────── */

/**
 * Computes a weighted overall score from AI dimension scores.
 *
 * @param aiScores - Raw dimension scores from the AI
 * @param rubric - The methodology's scoring rubric
 * @returns Computed scoring result with weighted totals
 */
export function computeScore(
  aiScores: DimensionScore[],
  rubric: ScoringDimension[],
): ScoringResult {
  const scoreMap = new Map(aiScores.map((s) => [s.key, s]));
  const missingDimensions: string[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  const dimensionScores = rubric.map((dimension) => {
    const aiScore = scoreMap.get(dimension.key);

    if (!aiScore) {
      missingDimensions.push(dimension.key);
      return {
        key: dimension.key,
        name: dimension.name,
        raw_score: 0,
        weighted_score: 0,
        weight: dimension.weight,
        evidence: 'Not assessed',
      };
    }

    // Clamp score to 1-10 range
    const rawScore = Math.max(1, Math.min(10, aiScore.score));
    const weightedScore = rawScore * dimension.weight;
    weightedSum += weightedScore;
    totalWeight += dimension.weight;

    return {
      key: dimension.key,
      name: dimension.name,
      raw_score: rawScore,
      weighted_score: weightedScore,
      weight: dimension.weight,
      evidence: aiScore.evidence,
    };
  });

  // Normalize to 0-100 scale (raw scores are 1-10, multiply by 10)
  const overallScore = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 10)
    : 0;

  return {
    overall_score: overallScore,
    dimension_scores: dimensionScores,
    is_complete: missingDimensions.length === 0,
    missing_dimensions: missingDimensions,
  };
}

/**
 * Validates that AI-returned dimension scores match the rubric's keys.
 * Returns true if all dimension keys are present and scores are valid numbers.
 */
export function validateScores(
  aiScores: DimensionScore[],
  rubric: ScoringDimension[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rubricKeys = new Set(rubric.map((d) => d.key));
  const scoreKeys = new Set(aiScores.map((s) => s.key));

  // Check for missing dimensions
  for (const key of rubricKeys) {
    if (!scoreKeys.has(key)) {
      errors.push(`Missing dimension: ${key}`);
    }
  }

  // Check for valid score ranges
  for (const score of aiScores) {
    if (typeof score.score !== 'number' || score.score < 1 || score.score > 10) {
      errors.push(`Invalid score for ${score.key}: ${score.score} (must be 1-10)`);
    }
  }

  return { valid: errors.length === 0, errors };
}
