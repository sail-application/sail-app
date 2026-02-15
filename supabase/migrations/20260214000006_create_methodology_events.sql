-- ============================================================================
-- Migration: 20260214000006_create_methodology_events
-- Purpose: Append-only event stream for methodology interaction tracking.
--
-- This is the analytics backbone. It captures:
--   - What users study (strategy_viewed)
--   - What the AI recommends (recommendation_given)
--   - Whether users follow recommendations (recommendation_followed/ignored)
--   - How users progress (stage_transition, milestone_achieved)
--   - Scoring data linked to specific methodologies
--
-- All events are linked to a methodology and optionally to a specific
-- feature session (practice, call, email). The payload JSONB carries
-- event-specific data without requiring schema changes for new event types.
-- ============================================================================

CREATE TABLE IF NOT EXISTS methodology_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who triggered this event
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which methodology this event relates to
  methodology_id UUID NOT NULL REFERENCES methodologies(id) ON DELETE CASCADE,

  -- Which SAIL feature generated this event
  feature TEXT NOT NULL CHECK (
    feature IN ('practice', 'live-call', 'email', 'analyzer', 'strategies')
  ),

  -- Optional link to a specific session (practice_session, call, email)
  session_id UUID,

  -- Controlled vocabulary of event types
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'strategy_viewed',
      'methodology_selected',
      'practice_started',
      'practice_completed',
      'call_analyzed',
      'recommendation_given',
      'recommendation_followed',
      'recommendation_ignored',
      'stage_transition',
      'score_generated',
      'milestone_achieved'
    )
  ),

  -- Event-specific data (varies by event_type)
  payload JSONB DEFAULT '{}',

  -- Speech analytics snapshot at event time (for AI correlation)
  speech_context JSONB,

  -- Which AI provider produced this event (for provider comparison)
  provider TEXT,
  model TEXT,
  latency_ms INTEGER,

  -- When this event occurred
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE methodology_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes (optimized for analytics queries)
-- ============================================================================

-- Time-series queries: "events in the last 7 days"
CREATE INDEX IF NOT EXISTS idx_methodology_events_occurred
  ON methodology_events (occurred_at DESC);

-- Per-user queries: "all my events"
CREATE INDEX IF NOT EXISTS idx_methodology_events_user
  ON methodology_events (user_id, occurred_at DESC);

-- Per-methodology analytics: "how is SPIN Selling being used?"
CREATE INDEX IF NOT EXISTS idx_methodology_events_methodology
  ON methodology_events (methodology_id, event_type);

-- Event type filtering: "all recommendation_followed events"
CREATE INDEX IF NOT EXISTS idx_methodology_events_type
  ON methodology_events (event_type, occurred_at DESC);

-- Session linkage: "all events for this practice session"
CREATE INDEX IF NOT EXISTS idx_methodology_events_session
  ON methodology_events (session_id) WHERE session_id IS NOT NULL;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Users can read their own events
DROP POLICY IF EXISTS "Users can read own methodology events" ON methodology_events;
CREATE POLICY "Users can read own methodology events"
  ON methodology_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own events (fire-and-forget from client)
DROP POLICY IF EXISTS "Users can create own methodology events" ON methodology_events;
CREATE POLICY "Users can create own methodology events"
  ON methodology_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can read all events (for analytics dashboards)
DROP POLICY IF EXISTS "Admins can read all methodology events" ON methodology_events;
CREATE POLICY "Admins can read all methodology events"
  ON methodology_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

COMMENT ON TABLE methodology_events IS 'Append-only event stream — tracks all methodology interactions for analytics and learning progression';
