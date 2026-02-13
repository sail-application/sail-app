-- ============================================================================
-- Migration: 20260213000011_create_user_notes
-- Purpose: User notes that can be linked to specific calls.
--
-- Users can create notes for various purposes:
--   - Post-call reflections linked to a specific call_history record
--   - General sales strategy notes
--   - AI-generated insights saved for later reference
--   - Study notes from the Strategies Library
--
-- Notes can be starred for quick access, categorized by source/type,
-- and tagged with skill areas for filtering.
--
-- Migrated from the legacy system — preserves the original data shape.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notes (
  -- Unique identifier for each note
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user owns this note — cascades on user deletion
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Note title (optional — can be auto-generated or user-provided)
  title TEXT,

  -- The main note content (free-form text)
  content TEXT,

  -- Where this note originated from
  -- e.g., 'call_analyzer', 'practice', 'manual', 'strategies'
  source TEXT,

  -- Whether the user has starred/favorited this note
  starred BOOLEAN DEFAULT false,

  -- Call segment this note relates to (e.g., 'opening', 'discovery', 'closing')
  segment TEXT,

  -- Skill area this note relates to (e.g., 'objection_handling', 'questioning')
  skill TEXT,

  -- Type of call this note is about (e.g., 'cold_call', 'follow_up', 'demo')
  call_type TEXT,

  -- AI-generated insight or suggestion associated with this note
  ai_insight TEXT,

  -- Optional link to a specific call record
  -- SET NULL on deletion so the note persists even if the call is deleted
  linked_call_id UUID REFERENCES call_history(id) ON DELETE SET NULL,

  -- Display name of the linked call (cached to avoid joins)
  linked_call_name TEXT,

  -- When the user last viewed this note (for "recently viewed" queries)
  last_viewed_at TIMESTAMPTZ,

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own notes
CREATE POLICY "Users can read own notes"
  ON user_notes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create new notes
CREATE POLICY "Users can create own notes"
  ON user_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON user_notes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON user_notes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add a comment on the table for documentation
COMMENT ON TABLE user_notes IS 'User notes — can be linked to calls, starred, and categorized by skill/source';
