/**
 * types/coaching-events.ts
 *
 * Type definitions for the methodology event tracking system.
 * Maps to the `methodology_events` table — an append-only event stream
 * that captures all methodology-related interactions across SAIL features.
 */

/* ──────────────── Event Type Union ──────────────── */

/** Controlled vocabulary of methodology event types */
export type MethodologyEventType =
  | 'strategy_viewed'
  | 'methodology_selected'
  | 'practice_started'
  | 'practice_completed'
  | 'call_analyzed'
  | 'recommendation_given'
  | 'recommendation_followed'
  | 'recommendation_ignored'
  | 'stage_transition'
  | 'score_generated'
  | 'milestone_achieved';

/** SAIL features that generate methodology events */
export type MethodologyFeature =
  | 'practice'
  | 'live-call'
  | 'email'
  | 'analyzer'
  | 'strategies';

/* ──────────────── Event Payloads ──────────────── */

/** Payload when a user views a strategy/technique card */
export interface StrategyViewedPayload {
  strategy_id: string;
  strategy_title: string;
  time_spent_seconds?: number;
}

/** Payload when a user selects a primary methodology */
export interface MethodologySelectedPayload {
  previous_methodology_id?: string;
  selection_context: string;
}

/** Payload when a practice session completes */
export interface PracticeCompletedPayload {
  score: number;
  duration_seconds: number;
  persona_type: string;
  difficulty: string;
  stages_reached: string[];
}

/** Payload when a call is analyzed */
export interface CallAnalyzedPayload {
  call_duration: number;
  overall_score: number;
  dimension_scores: Record<string, number>;
}

/** Payload when the AI gives a recommendation */
export interface RecommendationPayload {
  recommendation_text: string;
  technique_key?: string;
  stage_key?: string;
  confidence?: number;
}

/** Payload when a user transitions between methodology stages */
export interface StageTransitionPayload {
  from_stage: string;
  to_stage: string;
  trigger: string;
}

/** Payload when a per-dimension score is generated */
export interface ScoreGeneratedPayload {
  dimension_scores: Record<string, number>;
  weighted_total: number;
  evidence: Record<string, string>;
}

/** Payload when a user hits a progress milestone */
export interface MilestonePayload {
  milestone_type: string;
  milestone_value: string;
  previous_level?: string;
  new_level?: string;
}

/* ──────────────── Main Event Row ──────────────── */

/** Row in `methodology_events` — a single tracked interaction */
export interface MethodologyEvent {
  id: string;
  user_id: string;
  methodology_id: string;
  feature: MethodologyFeature;
  session_id: string | null;
  event_type: MethodologyEventType;
  /** Event-specific data (shape depends on event_type) */
  payload: Record<string, unknown>;
  /** Speech analytics snapshot at event time */
  speech_context: Record<string, unknown> | null;
  /** Which AI provider produced this event */
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  occurred_at: string;
}

/* ──────────────── Helper for creating events ──────────────── */

/** Input shape for creating a new methodology event (omit server-generated fields) */
export type CreateMethodologyEvent = Omit<MethodologyEvent, 'id' | 'occurred_at'>;
