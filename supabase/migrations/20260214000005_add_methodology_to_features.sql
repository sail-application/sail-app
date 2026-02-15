-- ============================================================================
-- Migration: 20260214000005_add_methodology_to_features
-- Purpose: Add methodology_id FK to all feature tables so every session
--          records which methodology was active during that interaction.
--
-- Also adds missing indexes identified by DevOps review, and drops the
-- hardcoded Paul Cherry CHECK constraint on practice_sessions.commitment_stage
-- (different methodologies have different stage names).
-- ============================================================================

-- ── Practice Sessions ──
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS methodology_id UUID
    REFERENCES methodologies(id) ON DELETE SET NULL;

ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS methodology_scores JSONB DEFAULT '[]';

-- Drop the hardcoded Paul Cherry commitment_stage CHECK constraint.
-- Stages are now methodology-specific freeform text from the methodology's
-- stages JSONB. We need to drop and recreate without the constraint.
ALTER TABLE practice_sessions
  DROP CONSTRAINT IF EXISTS practice_sessions_commitment_stage_check;

-- Add missing index (DevOps review)
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user
  ON practice_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_methodology
  ON practice_sessions (methodology_id) WHERE methodology_id IS NOT NULL;

-- ── Call History ──
ALTER TABLE call_history
  ADD COLUMN IF NOT EXISTS methodology_id UUID
    REFERENCES methodologies(id) ON DELETE SET NULL;

ALTER TABLE call_history
  ADD COLUMN IF NOT EXISTS methodology_scores JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_call_history_methodology
  ON call_history (methodology_id) WHERE methodology_id IS NOT NULL;

-- ── Email Conversations ──
ALTER TABLE email_conversations
  ADD COLUMN IF NOT EXISTS methodology_id UUID
    REFERENCES methodologies(id) ON DELETE SET NULL;

-- Add missing index (DevOps review)
CREATE INDEX IF NOT EXISTS idx_email_conversations_user
  ON email_conversations (user_id);

CREATE INDEX IF NOT EXISTS idx_email_conversations_methodology
  ON email_conversations (methodology_id) WHERE methodology_id IS NOT NULL;

-- ── Token Usage Logs ──
ALTER TABLE token_usage_logs
  ADD COLUMN IF NOT EXISTS methodology_id UUID
    REFERENCES methodologies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_token_usage_methodology
  ON token_usage_logs (methodology_id) WHERE methodology_id IS NOT NULL;

-- ── User Notes (missing index from DevOps review) ──
CREATE INDEX IF NOT EXISTS idx_user_notes_user
  ON user_notes (user_id);

COMMENT ON COLUMN practice_sessions.methodology_id IS 'Which methodology was active during this practice session';
COMMENT ON COLUMN call_history.methodology_id IS 'Which methodology was active when this call was analyzed';
COMMENT ON COLUMN email_conversations.methodology_id IS 'Which methodology guided email composition';
