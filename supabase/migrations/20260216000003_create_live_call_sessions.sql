-- ============================================================================
-- Migration: 20260216000003_create_live_call_sessions
-- Purpose: Track live call coaching sessions.
--
-- Live Call Assistant provides real-time coaching during active conversations.
-- Each session captures the transcript (via Web Speech API STT), the AI
-- coaching events emitted during the call, and a dynamic checklist that
-- auto-completes as topics are covered.
--
-- The checklist_state JSONB is updated in real time as the transcript
-- reveals information (budget mentioned → budget item checked, etc.).
-- ============================================================================

CREATE TABLE IF NOT EXISTS live_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user who ran this live call session
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Links to a saved session configuration (methodology selection, context pack)
  session_config_id UUID REFERENCES session_configurations(id) ON DELETE SET NULL,

  -- Lifecycle: active while call is running, completed when user ends it
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),

  -- Full conversation transcript captured via Web Speech API
  -- Array of: { "speaker": "user"|"prospect", "text": "...", "timestamp": "..." }
  transcript JSONB DEFAULT '[]',

  -- Real-time coaching suggestions emitted during the call
  -- Array of: { "id": "...", "timestamp": "...", "type": "tip"|"alert", "content": "..." }
  coaching_events JSONB DEFAULT '[]',

  -- Dynamic checklist state — items are marked complete as they're covered in the call
  -- Shape: { "budget": false, "timeline": true, "pain_points": false, ... }
  checklist_state JSONB DEFAULT '{}',

  -- Qualification data extracted from the transcript
  -- Shape: { "budget": "~$5k", "decision_maker": "Dana", "timeline": "Q2" }
  qualification_data JSONB DEFAULT '{}',

  -- Call duration in seconds (calculated when session is completed)
  duration_seconds INTEGER,

  -- When the call session started
  created_at TIMESTAMPTZ DEFAULT now(),

  -- When the call session was ended (null while active)
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE live_call_sessions ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ────────────────────────────────────────────────────────────

-- Users can read their own live call sessions
CREATE POLICY "Users can read own live call sessions"
  ON live_call_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own live call sessions
CREATE POLICY "Users can create own live call sessions"
  ON live_call_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own live call sessions (e.g., mark completed, update transcript)
CREATE POLICY "Users can update own live call sessions"
  ON live_call_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own live call sessions
CREATE POLICY "Users can delete own live call sessions"
  ON live_call_sessions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Fast lookup of a user's sessions by status
CREATE INDEX IF NOT EXISTS idx_live_call_sessions_user_status
  ON live_call_sessions (user_id, status);

-- Index for sessions tied to a configuration
CREATE INDEX IF NOT EXISTS idx_live_call_sessions_config
  ON live_call_sessions (session_config_id)
  WHERE session_config_id IS NOT NULL;

COMMENT ON TABLE live_call_sessions IS 'Live call coaching sessions — real-time AI coaching with transcript, checklist, and qualification tracking';
