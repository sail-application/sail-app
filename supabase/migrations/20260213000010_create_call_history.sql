-- ============================================================================
-- Migration: 20260213000010_create_call_history
-- Purpose: Call recordings and post-call analysis from the Call Analyzer feature.
--
-- After a user completes a sales call (or uploads a recording), the Call
-- Analyzer processes it and stores:
--   - Full transcript of the call
--   - AI-generated summary and actionable suggestions
--   - Score based on Paul Cherry methodology effectiveness
--   - Pinned insights the user wants to remember
--   - AI-generated follow-up email draft
--
-- Migrated from the legacy system — preserves the original data shape.
-- ============================================================================

CREATE TABLE IF NOT EXISTS call_history (
  -- Unique identifier for each call record
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user owns this call — cascades on user deletion
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Call duration in seconds
  duration INTEGER,

  -- Full text transcript of the call
  transcript TEXT,

  -- AI-generated call summary stored as JSONB
  -- e.g., { "overview": "...", "key_topics": [...], "outcome": "..." }
  summary JSONB DEFAULT '{}',

  -- AI-generated improvement suggestions stored as JSONB array
  -- e.g., [{ "area": "questioning", "suggestion": "...", "priority": "high" }]
  suggestions JSONB DEFAULT '[]',

  -- User-pinned insights from the call stored as JSONB array
  -- e.g., [{ "text": "...", "timestamp": "2:34", "category": "objection" }]
  pinned_insights JSONB DEFAULT '[]',

  -- Overall effectiveness score (0.00 to 100.00)
  -- Based on Paul Cherry methodology adherence
  score NUMERIC(5,2),

  -- AI-generated follow-up email based on the call
  follow_up_email TEXT,

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Index on user_id: for fetching a user's call history
CREATE INDEX idx_call_history_user_id ON call_history(user_id);

-- Index on created_at: for chronological call history queries
CREATE INDEX idx_call_history_created_at ON call_history(created_at);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own call history
CREATE POLICY "Users can read own call history"
  ON call_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create new call records
CREATE POLICY "Users can create own call history"
  ON call_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own call records (e.g., pin insights)
CREATE POLICY "Users can update own call history"
  ON call_history
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own call records
CREATE POLICY "Users can delete own call history"
  ON call_history
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add a comment on the table for documentation
COMMENT ON TABLE call_history IS 'Call recordings and post-call analysis — stores transcripts, scores, and AI suggestions';
