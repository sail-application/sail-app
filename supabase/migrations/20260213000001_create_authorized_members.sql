-- ============================================================================
-- Migration: 20260213000001_create_authorized_members
-- Purpose: Skool community email whitelist for SAIL access gating.
--
-- SAIL is gated to SA Picture Day's Skool community members only.
-- During the auth callback (Google OAuth → Supabase), the system checks
-- this table to verify the user's email is whitelisted and is_active = true.
-- If not found or inactive, signup/login is rejected.
--
-- Admin users manage this table via the admin panel.
-- The service role is used during auth callback checks (bypasses RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS authorized_members (
  -- Unique identifier for each whitelist entry
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The email address that is authorized to access SAIL
  -- Must be unique — one entry per email
  email TEXT NOT NULL UNIQUE,

  -- Optional: the member's Skool community username for reference
  skool_username TEXT,

  -- Whether this member is currently allowed access
  -- Set to false to revoke access without deleting the record
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Which admin added this member (nullable for seed/import data)
  added_by UUID REFERENCES auth.users(id),

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE authorized_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Admins can view all authorized members
-- Used in the admin panel to manage the whitelist
CREATE POLICY "Admins can view authorized members"
  ON authorized_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can insert new authorized members
CREATE POLICY "Admins can insert authorized members"
  ON authorized_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update authorized members (e.g., toggle is_active)
CREATE POLICY "Admins can update authorized members"
  ON authorized_members
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

-- Policy: Admins can delete authorized members
CREATE POLICY "Admins can delete authorized members"
  ON authorized_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Note: The service role (used during auth callbacks) bypasses RLS entirely,
-- so no explicit policy is needed for the auth check flow.

-- Add a comment on the table for documentation
COMMENT ON TABLE authorized_members IS 'Skool community email whitelist — controls who can access SAIL';
