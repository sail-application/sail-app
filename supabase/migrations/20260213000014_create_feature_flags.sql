-- ============================================================================
-- Migration: 20260213000014_create_feature_flags
-- Purpose: Simple feature flag system for controlling feature rollout.
--
-- Feature flags allow admins to enable/disable features without code deploys.
-- Each flag has:
--   - A unique key used in code checks (e.g., 'voice_practice')
--   - A description explaining what the flag controls
--   - An is_enabled boolean for quick toggling
--   - A metadata JSONB field for additional config (e.g., percentage rollout)
--
-- Default flags are seeded for all planned features that aren't GA yet.
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  -- Unique identifier for each flag
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The flag key used in application code to check feature status
  -- e.g., if (featureFlags.voice_practice) { ... }
  key TEXT NOT NULL UNIQUE,

  -- Human-readable description of what this flag controls
  description TEXT,

  -- Whether the feature is currently enabled
  is_enabled BOOLEAN DEFAULT false,

  -- Additional metadata for advanced flag configuration
  -- e.g., { "rollout_percentage": 50, "allowed_roles": ["admin"] }
  metadata JSONB DEFAULT '{}',

  -- Which admin last toggled this flag
  updated_by UUID REFERENCES auth.users(id),

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: All authenticated users can read feature flags
-- The app checks flags on every page load to determine which features to show
CREATE POLICY "Authenticated users can read feature flags"
  ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can insert new feature flags
CREATE POLICY "Admins can insert feature flags"
  ON feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update feature flags (toggle on/off)
CREATE POLICY "Admins can update feature flags"
  ON feature_flags
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

-- Policy: Admins can delete feature flags
CREATE POLICY "Admins can delete feature flags"
  ON feature_flags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- Seed: Default feature flags (all disabled until ready for rollout)
-- ============================================================================

INSERT INTO feature_flags (key, description, is_enabled) VALUES
  ('voice_practice',     'Enable voice-based practice mode with speech-to-text',              false),
  ('timed_mode',         'Enable timed practice sessions with countdown timer',               false),
  ('confidence_meter',   'Show real-time confidence meter during practice sessions',           false),
  ('expert_comparison',  'Allow users to compare their responses with expert examples',        false),
  ('custom_scenarios',   'Allow users to create custom practice scenarios',                    false),
  ('maintenance_mode',   'Put the entire app into maintenance mode (shows maintenance page)',   false)
ON CONFLICT (key) DO NOTHING;

-- Add a comment on the table for documentation
COMMENT ON TABLE feature_flags IS 'Feature flag system — controls feature rollout without code deploys';
