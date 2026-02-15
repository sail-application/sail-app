/**
 * types/methodology.ts
 *
 * Type definitions for the Methodologies Library feature.
 * Covers the methodology row, user preferences, and all JSONB
 * sub-structures used for AI coaching content.
 *
 * These types map directly to the `methodologies` and
 * `user_methodology_preferences` Supabase tables.
 */

/* ──────────────── AI Coaching Sub-structures ──────────────── */

/** Weighted scoring dimension — AI rates 1-10, app does weighted math */
export interface ScoringDimension {
  key: string;
  name: string;
  description: string;
  /** Weight between 0 and 1; all dimensions should sum to 1.0 */
  weight: number;
  /** Score range descriptions, e.g. {"1-3": "Poor...", "7-9": "Strong..."} */
  anchors: Record<string, string>;
}

/** Ordered progression phase within a methodology */
export interface MethodologyStage {
  key: string;
  name: string;
  order: number;
  description: string;
  /** Observable buyer behaviors that indicate this stage */
  signals: string[];
  /** Cues that the conversation should move to the next stage */
  transition_cues: string[];
  /** AI coaching tips for this stage */
  coaching_tips: string[];
}

/** Question type taxonomy entry */
export interface QuestionType {
  key: string;
  name: string;
  description: string;
  purpose: string;
  examples: string[];
  /** Which stages this question type is most effective in */
  stage_affinity: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/** Common mistake the AI should detect and correct */
export interface AntiPattern {
  name: string;
  description: string;
  /** Signals in conversation that indicate this mistake */
  detection_signals: string[];
  /** How the AI should respond when detected */
  coaching_response: string;
}

/** Positive behavior the AI should reinforce */
export interface SuccessSignal {
  name: string;
  description: string;
  /** How important this signal is for scoring */
  significance: string;
}

/** Video reference for a methodology */
export interface MethodologyVideo {
  title: string;
  url: string;
  duration?: string;
  description?: string;
}

/** Book reference for a methodology */
export interface MethodologyBook {
  title: string;
  author: string;
  isbn?: string;
  url?: string;
  year?: number;
}

/** Learning objective (Bloom's taxonomy aligned) */
export interface LearningObjective {
  statement: string;
  bloom_level: string;
  assessment_criteria: string;
}

/** Micro-lesson chunk for progressive learning */
export interface ConceptChunk {
  id: string;
  title: string;
  type: string;
  content: string;
  estimated_minutes: number;
  prerequisite_chunks: string[];
}

/* ──────────────── Main Methodology Row ──────────────── */

/** Row in `methodologies` — a sales methodology with AI coaching content */
export interface Methodology {
  id: string;
  name: string;
  slug: string;
  author: string;
  tagline: string | null;
  description: string;
  how_it_works: string | null;
  best_for: string | null;
  videos: MethodologyVideo[];
  books: MethodologyBook[];
  icon: string;
  category: string;
  relevance_rating: number;
  complexity_level: string;
  tags: string[];
  /* AI coaching content */
  system_prompt_template: string | null;
  feature_prompt_overrides: Record<string, string>;
  scoring_rubric: ScoringDimension[];
  stages: MethodologyStage[];
  question_types: QuestionType[];
  vocabulary: Record<string, string>;
  anti_patterns: AntiPattern[];
  success_signals: SuccessSignal[];
  /* Learning content */
  learning_objectives: LearningObjective[];
  concept_chunks: ConceptChunk[];
  /* Provider preferences */
  preferred_provider: string | null;
  preferred_model: string | null;
  /* Access and attribution */
  access_tier: string;
  trademark_attribution: string | null;
  known_as: string | null;
  contributor_id: string | null;
  content_source: string | null;
  /* Metadata */
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Subset of Methodology for listing cards (avoids loading AI content) */
export type MethodologyListItem = Pick<
  Methodology,
  | 'id' | 'name' | 'slug' | 'author' | 'tagline'
  | 'icon' | 'category' | 'relevance_rating' | 'complexity_level'
  | 'tags' | 'access_tier' | 'sort_order' | 'is_active'
  | 'trademark_attribution'
>;

/* ──────────────── User Preferences ──────────────── */

/** Row in `user_methodology_preferences` */
export interface UserMethodologyPreference {
  id: string;
  user_id: string;
  methodology_id: string;
  is_enabled: boolean;
  is_primary: boolean;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  started_at: string;
  last_used_at: string | null;
  next_review_at: string | null;
}
