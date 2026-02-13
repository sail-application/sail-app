-- ============================================================================
-- Migration: 20260213000006_create_token_usage_logs
-- Purpose: Track AI token consumption per feature per user.
--
-- Every AI request logs its token usage here for:
--   - Cost tracking and budgeting (tokens → dollars)
--   - Per-user usage analytics
--   - Per-feature usage patterns
--   - Latency monitoring
--   - Rate limiting decisions
--
-- This table is append-only (insert-heavy, no updates).
-- The service role handles inserts from API routes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_usage_logs (
  -- Unique identifier for each usage log entry
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user made the AI request
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Which feature generated this usage (live-call, practice, email, etc.)
  feature TEXT NOT NULL,

  -- Which AI provider was used
  provider TEXT NOT NULL,

  -- Which specific model was used
  model TEXT NOT NULL,

  -- Token counts — prompt is input, completion is output
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- How long the AI request took in milliseconds
  -- Useful for monitoring latency SLAs (e.g., live-call must be <2000ms)
  latency_ms INTEGER,

  -- When this usage occurred
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE token_usage_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Index on user_id: for querying a specific user's usage history
CREATE INDEX idx_token_usage_logs_user_id ON token_usage_logs(user_id);

-- Index on feature: for per-feature usage aggregation
CREATE INDEX idx_token_usage_logs_feature ON token_usage_logs(feature);

-- Index on created_at: for time-range queries (daily/weekly/monthly reports)
CREATE INDEX idx_token_usage_logs_created_at ON token_usage_logs(created_at);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own token usage
-- Shown on the user's dashboard for personal usage tracking
CREATE POLICY "Users can read own token usage"
  ON token_usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can read all token usage
-- Needed for the admin cost dashboard and usage analytics
CREATE POLICY "Admins can read all token usage"
  ON token_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Allow inserts for logging
-- Service role bypasses RLS for server-side inserts, but we also allow
-- authenticated inserts with a permissive WITH CHECK for edge cases
-- where the API route runs in the user's context
CREATE POLICY "Allow token usage inserts"
  ON token_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add a comment on the table for documentation
COMMENT ON TABLE token_usage_logs IS 'AI token consumption logs — tracks usage per feature per user for cost monitoring';
