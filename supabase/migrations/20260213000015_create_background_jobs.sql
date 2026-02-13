-- ============================================================================
-- Migration: 20260213000015_create_background_jobs
-- Purpose: Async job queue for background processing tasks.
--
-- SAIL uses background jobs for tasks that shouldn't block the user:
--   - Processing uploaded call recordings
--   - Syncing data with Zoho Bigin CRM
--   - Bulk email composition
--   - Generating aggregate analytics
--   - Skool community membership sync
--
-- Jobs follow a simple state machine:
--   pending → processing → completed
--                        → failed (retries up to max_attempts)
--
-- A Supabase Edge Function (or pg_cron) polls this table for pending
-- jobs and processes them. The scheduled_for column allows delayed execution.
-- ============================================================================

CREATE TABLE IF NOT EXISTS background_jobs (
  -- Unique identifier for each job
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job type identifier (e.g., 'process_call', 'sync_crm', 'send_email')
  type TEXT NOT NULL,

  -- Job parameters stored as JSONB
  -- Contents depend on the job type
  -- e.g., { "call_id": "...", "user_id": "..." }
  payload JSONB DEFAULT '{}',

  -- Current job status — tracks the state machine progression
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ) DEFAULT 'pending',

  -- How many times this job has been attempted
  -- Incremented each time processing starts
  attempts INTEGER DEFAULT 0,

  -- Maximum retry attempts before permanently marking as failed
  max_attempts INTEGER DEFAULT 3,

  -- Error details if the job failed (null on success)
  error_message TEXT,

  -- When this job should be processed (allows delayed/scheduled jobs)
  -- Default is now() for immediate processing
  scheduled_for TIMESTAMPTZ DEFAULT now(),

  -- When processing started (null if still pending)
  started_at TIMESTAMPTZ,

  -- When processing completed or failed (null if still in progress)
  completed_at TIMESTAMPTZ,

  -- When this job was created
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Composite index on status + scheduled_for: used by the job poller
-- to efficiently find the next pending job that's ready to run
CREATE INDEX idx_background_jobs_status_scheduled
  ON background_jobs(status, scheduled_for)
  WHERE status = 'pending';

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Admins can read all jobs (for monitoring in admin panel)
CREATE POLICY "Admins can read background jobs"
  ON background_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Allow inserts for creating new jobs
-- Jobs are created by API routes. Service role bypasses RLS for server-side
-- creation, but we allow authenticated inserts as a fallback.
CREATE POLICY "Allow background job inserts"
  ON background_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow updates for processing status changes
-- The job worker updates status, attempts, error_message, started_at, completed_at.
-- Service role handles most updates, but admins can also retry failed jobs.
CREATE POLICY "Admins can update background jobs"
  ON background_jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Add a comment on the table for documentation
COMMENT ON TABLE background_jobs IS 'Async job queue — tracks background tasks with retry logic and scheduling';
