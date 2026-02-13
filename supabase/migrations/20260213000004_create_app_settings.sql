-- ============================================================================
-- Migration: 20260213000004_create_app_settings
-- Purpose: Key-value configuration store for admin-managed app settings.
--
-- This table provides a flexible way to store application settings without
-- needing schema changes. Settings are organized by category and accessed
-- by key. Values are stored as JSONB for maximum flexibility.
--
-- Examples of settings:
--   - category: 'general', key: 'app_name', value: '"SAIL"'
--   - category: 'email', key: 'default_sender', value: '"noreply@sapicture.day"'
--   - category: 'limits', key: 'max_daily_calls', value: '50'
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  -- Unique identifier for each setting
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Settings are grouped by category for organization
  -- e.g., 'general', 'email', 'ai', 'limits', 'notifications'
  category TEXT NOT NULL,

  -- The setting key within its category
  key TEXT NOT NULL,

  -- The setting value stored as JSONB for flexibility
  -- Can hold strings, numbers, booleans, arrays, or objects
  value JSONB DEFAULT '{}',

  -- Human-readable label for the admin panel UI
  label TEXT,

  -- Explanation of what this setting controls
  description TEXT,

  -- When this setting was last modified
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Which admin last modified this setting
  updated_by UUID REFERENCES auth.users(id),

  -- Composite unique constraint: one key per category
  UNIQUE(category, key)
);

-- Enable Row Level Security — required on every table
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: All authenticated users can read settings
-- The app needs to check settings for feature behavior, limits, etc.
CREATE POLICY "Authenticated users can read settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can insert new settings
CREATE POLICY "Admins can insert settings"
  ON app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update settings
CREATE POLICY "Admins can update settings"
  ON app_settings
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

-- Policy: Admins can delete settings
CREATE POLICY "Admins can delete settings"
  ON app_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Add a comment on the table for documentation
COMMENT ON TABLE app_settings IS 'Key-value config store — admin-managed application settings organized by category';
