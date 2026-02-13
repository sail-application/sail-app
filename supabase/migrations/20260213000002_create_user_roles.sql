-- ============================================================================
-- Migration: 20260213000002_create_user_roles
-- Purpose: Role-Based Access Control (RBAC) for SAIL users.
--
-- Every authenticated user gets exactly one role:
--   - admin: Full access to all features, settings, and user management
--   - team_lead: Can manage their team's reps and view team analytics
--   - rep: Standard sales rep — access to core features only
--
-- Default role is 'rep'. Admins can promote users via the admin panel.
-- The user_id column has a UNIQUE constraint — one role per user.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  -- Unique identifier for each role assignment
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user this role belongs to — cascades on user deletion
  -- UNIQUE ensures one role per user (no multi-role complexity)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- The role assigned to this user
  -- CHECK constraint enforces only valid roles
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_lead', 'rep')) DEFAULT 'rep',

  -- Which admin assigned this role (nullable for auto-created roles)
  assigned_by UUID REFERENCES auth.users(id),

  -- When this role was created
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own role
-- Needed so the app can check the current user's permissions
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can read all roles
-- Needed for the admin panel user management
CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Policy: Admins can insert new roles
-- Used when new users are created or roles are manually assigned
CREATE POLICY "Admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Policy: Admins can update roles (e.g., promote rep → team_lead)
CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Policy: Admins can delete roles
CREATE POLICY "Admins can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Add a comment on the table for documentation
COMMENT ON TABLE user_roles IS 'RBAC role assignments — one role per user (admin, team_lead, rep)';
