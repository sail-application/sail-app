-- ============================================================================
-- Migration: 20260213000012_create_practice_sessions
-- Purpose: Practice mode session tracking for AI roleplay training.
--
-- Practice Mode is one of SAIL's core features. Users roleplay sales calls
-- with an AI persona (e.g., a dance studio owner, school principal) and
-- receive real-time coaching feedback.
--
-- Each session tracks:
--   - The persona type and difficulty level
--   - Complete conversation transcript (messages)
--   - AI-generated feedback and score
--   - Which commitment stage the user reached (Paul Cherry methodology)
--
-- Commitment stages follow Paul Cherry's "Questions That Sell" framework:
--   - 'sure': Prospect is open but uncommitted
--   - 'want-to': Prospect wants the service but hasn't committed
--   - 'have-to': Prospect feels urgency and commits
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_sessions (
  -- Unique identifier for each practice session
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user completed this session — cascades on user deletion
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The AI persona type the user practiced with
  persona_type TEXT CHECK (
    persona_type IN ('principal', 'administrator', 'dance', 'daycare', 'sports')
  ),

  -- Difficulty level of the practice scenario
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),

  -- Overall session score (0.00 to 100.00)
  score NUMERIC(5,2),

  -- How long the session lasted in seconds
  duration_seconds INTEGER,

  -- Full conversation transcript stored as JSONB array
  -- Each message: { "role": "user"|"assistant"|"coach", "content": "...", "timestamp": "..." }
  messages JSONB DEFAULT '[]',

  -- AI-generated session feedback stored as JSONB
  -- e.g., { "strengths": [...], "improvements": [...], "tips": [...] }
  feedback JSONB DEFAULT '{}',

  -- The highest commitment stage the user reached during the session
  -- Tracks progress through Paul Cherry's methodology
  commitment_stage TEXT CHECK (
    commitment_stage IN ('sure', 'want-to', 'have-to')
  ),

  -- When this session occurred
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own practice sessions
CREATE POLICY "Users can read own practice sessions"
  ON practice_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create new practice sessions
CREATE POLICY "Users can create own practice sessions"
  ON practice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own sessions (e.g., update score at end)
CREATE POLICY "Users can update own practice sessions"
  ON practice_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own practice sessions"
  ON practice_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add a comment on the table for documentation
COMMENT ON TABLE practice_sessions IS 'Practice mode sessions — AI roleplay training with scoring and commitment stage tracking';
