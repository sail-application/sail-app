-- ============================================================================
-- Migration: 20260216000002_update_practice_sessions
-- Purpose: Extend the existing practice_sessions table for multi-methodology
--          and industry-agnostic session support.
--
-- The original table (20260213000012) was built for photography-specific
-- personas (principal, administrator, dance, daycare, sports) and a single
-- Paul Cherry methodology. This migration:
--   - Adds a link to session_configurations (for multi-methodology support)
--   - Adds session status tracking (active / completed / abandoned)
--   - Adds scenario_description (free-text, replaces the typed persona_type)
--   - Adds coach_notes (structured AI coaching observations during session)
--   - Adds completed_at timestamp
--   - Renames 'messages' to 'transcript' for clarity (adds alias column)
--   - Changes 'score' to JSONB to support weighted methodology scoring
-- ============================================================================

-- ── Add new columns ──────────────────────────────────────────────────────────

-- Link to a session_configurations row (captures which methodologies were active)
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS session_config_id UUID REFERENCES session_configurations(id) ON DELETE SET NULL;

-- Track session lifecycle
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned'));

-- Free-text scenario (replaces the constrained persona_type enum)
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS scenario_description TEXT;

-- Structured coach notes emitted during the session
-- Array of: { "timestamp": "...", "stage": "...", "note": "...", "type": "tip"|"warning"|"praise" }
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS coach_notes JSONB DEFAULT '[]';

-- JSONB score (replaces the old NUMERIC score for multi-methodology weighting)
-- Shape: { "overall": 82, "dimensions": { "rapport": 9, "discovery": 7, ... } }
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS score_jsonb JSONB;

-- When the session was finished (null while active)
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ── Add index for fast lookup of active sessions ──────────────────────────────

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_status
  ON practice_sessions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_config
  ON practice_sessions (session_config_id)
  WHERE session_config_id IS NOT NULL;

COMMENT ON COLUMN practice_sessions.session_config_id IS 'Links to session_configurations for multi-methodology context';
COMMENT ON COLUMN practice_sessions.status IS 'Lifecycle: active (in progress), completed (finished), abandoned (user left)';
COMMENT ON COLUMN practice_sessions.scenario_description IS 'Free-text description of the practice scenario (replaces typed persona_type)';
COMMENT ON COLUMN practice_sessions.coach_notes IS 'AI-generated coaching observations emitted during the session';
COMMENT ON COLUMN practice_sessions.score_jsonb IS 'Weighted multi-methodology score; replaces the old NUMERIC score column';
