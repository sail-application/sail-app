-- ============================================================================
-- Migration: 20260213000007_create_audit_logs
-- Purpose: Admin action tracking and audit trail.
--
-- Records significant administrative actions for security and compliance:
--   - User role changes
--   - Settings modifications
--   - Member whitelist changes
--   - AI config updates
--   - Feature flag toggles
--
-- This table is append-only. Records should never be updated or deleted
-- to maintain audit integrity. The service role handles inserts from
-- server-side API routes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  -- Unique identifier for each audit entry
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user performed the action
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- What action was performed (e.g., 'update_role', 'toggle_feature_flag')
  action TEXT NOT NULL,

  -- What type of resource was affected (e.g., 'user_role', 'app_setting')
  resource_type TEXT NOT NULL,

  -- The specific resource ID that was affected (nullable for bulk actions)
  resource_id TEXT,

  -- Additional context about the action stored as JSONB
  -- e.g., { "old_role": "rep", "new_role": "team_lead" }
  details JSONB DEFAULT '{}',

  -- The IP address of the request (for security auditing)
  ip_address TEXT,

  -- When this action occurred
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Index on user_id: for finding all actions by a specific admin
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Index on created_at: for chronological audit trail queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Admins can read audit logs
-- Only admins should be able to review the audit trail
CREATE POLICY "Admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Allow inserts via service role
-- Audit logs are inserted server-side; service role bypasses RLS.
-- We also allow authenticated inserts for API routes running in user context.
CREATE POLICY "Allow audit log inserts"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add a comment on the table for documentation
COMMENT ON TABLE audit_logs IS 'Admin action audit trail — append-only log of significant actions for security';
