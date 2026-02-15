/**
 * lib/tracking/methodology-tracker.ts
 *
 * Fire-and-forget event logging for methodology interactions.
 * Same pattern as lib/ai/usage-tracker.ts — never blocks the response flow.
 *
 * Inserts into the `methodology_events` append-only table for analytics.
 * All methodology-related interactions (views, selections, practice
 * completions, recommendations, scores) flow through this tracker.
 */

import type {
  MethodologyEventType,
  MethodologyFeature,
} from '@/types/coaching-events';

/* ──────────────── Types ──────────────── */

/** Input for tracking a methodology event */
export interface TrackEventInput {
  userId: string;
  methodologyId: string;
  feature: MethodologyFeature;
  eventType: MethodologyEventType;
  /** Optional link to a specific session */
  sessionId?: string;
  /** Event-specific data */
  payload?: Record<string, unknown>;
  /** Speech analytics snapshot at event time */
  speechContext?: Record<string, unknown>;
  /** Which AI provider was involved */
  provider?: string;
  model?: string;
  latencyMs?: number;
}

/* ──────────────── Public API ──────────────── */

/**
 * Tracks a methodology event. Fire-and-forget — kicks off an async
 * insert but does not block the caller.
 */
export function trackMethodologyEvent(input: TrackEventInput): void {
  void (async () => {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();

      const { error } = await supabase.from('methodology_events').insert({
        user_id: input.userId,
        methodology_id: input.methodologyId,
        feature: input.feature,
        session_id: input.sessionId ?? null,
        event_type: input.eventType,
        payload: input.payload ?? {},
        speech_context: input.speechContext ?? null,
        provider: input.provider ?? null,
        model: input.model ?? null,
        latency_ms: input.latencyMs ?? null,
      });

      if (error) {
        console.error('[MethodologyTracker] Insert failed:', error.message);
      }
    } catch (err) {
      // Non-critical — never break the response flow
      console.error('[MethodologyTracker] Unexpected error:', err);
    }
  })();
}
