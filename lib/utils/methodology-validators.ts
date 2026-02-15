/**
 * lib/utils/methodology-validators.ts
 *
 * Zod schemas for validating methodology API inputs.
 * Used in API routes to validate request bodies before DB operations.
 */

import { z } from 'zod';

/* ──────────────── Shared Sub-schemas ──────────────── */

export const videoSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  duration: z.string().optional(),
  description: z.string().optional(),
});

export const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  url: z.string().url().optional(),
  year: z.number().int().optional(),
  cover_url: z.string().url().optional(),
});

export const scoringDimensionSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  weight: z.number().min(0).max(1),
  anchors: z.record(z.string(), z.string()),
});

export const stageSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int(),
  description: z.string(),
  signals: z.array(z.string()),
  transition_cues: z.array(z.string()),
  coaching_tips: z.array(z.string()),
});

export const questionTypeSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  purpose: z.string(),
  examples: z.array(z.string()),
  stage_affinity: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

/* ──────────────── Methodology Create/Update ──────────────── */

/** Schema for creating a new methodology (admin) */
export const createMethodologySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  author: z.string().min(1).max(200),
  tagline: z.string().max(500).optional(),
  description: z.string().min(1),
  how_it_works: z.string().optional(),
  best_for: z.string().optional(),
  videos: z.array(videoSchema).default([]),
  books: z.array(bookSchema).default([]),
  icon: z.string().default('book-open'),
  category: z.string().min(1),
  relevance_rating: z.number().int().min(1).max(5).default(3),
  complexity_level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  tags: z.array(z.string()).default([]),
  system_prompt_template: z.string().optional(),
  feature_prompt_overrides: z.record(z.string(), z.string()).default({}),
  scoring_rubric: z.array(scoringDimensionSchema).default([]),
  stages: z.array(stageSchema).default([]),
  question_types: z.array(questionTypeSchema).default([]),
  vocabulary: z.record(z.string(), z.string()).default({}),
  anti_patterns: z.array(z.object({
    name: z.string(), description: z.string(),
    detection_signals: z.array(z.string()), coaching_response: z.string(),
  })).default([]),
  success_signals: z.array(z.object({
    name: z.string(), description: z.string(), significance: z.string(),
  })).default([]),
  learning_objectives: z.array(z.object({
    statement: z.string(), bloom_level: z.string(), assessment_criteria: z.string(),
  })).default([]),
  concept_chunks: z.array(z.object({
    id: z.string(), title: z.string(), type: z.string(), content: z.string(),
    estimated_minutes: z.number(), prerequisite_chunks: z.array(z.string()),
  })).default([]),
  access_tier: z.enum(['free', 'pro', 'team']).default('pro'),
  trademark_attribution: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

/** Schema for updating a methodology (all fields optional) */
export const updateMethodologySchema = createMethodologySchema.partial();

/* ──────────────── User Preference Update ──────────────── */

/** Schema for updating a user's methodology preference */
export const updatePreferenceSchema = z.object({
  methodology_id: z.string().uuid(),
  is_enabled: z.boolean().optional(),
  is_primary: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

/** Schema for bulk reordering user methodology preferences */
export const userReorderSchema = z.object({
  items: z.array(z.object({
    methodology_id: z.string().uuid(),
    sort_order: z.number().int(),
  })),
});

/* ──────────────── Reorder ──────────────── */

/** Schema for bulk reordering methodologies (admin) */
export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sort_order: z.number().int(),
  })),
});
