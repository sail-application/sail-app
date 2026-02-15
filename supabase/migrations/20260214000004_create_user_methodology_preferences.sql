-- ============================================================================
-- Migration: 20260214000004_create_user_methodology_preferences
-- Purpose: Per-user methodology enablement and proficiency tracking.
--
-- Each user can enable multiple methodologies but must have exactly one
-- primary. A partial unique index enforces the one-primary constraint
-- at the database level (no application logic needed).
--
-- Proficiency levels drive AI coaching depth:
--   beginner     → verbatim scripts and example phrases
--   intermediate → strategic guidance with context
--   advanced     → high-level coaching and pattern recognition
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_methodology_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user owns this preference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which methodology this preference is for
  methodology_id UUID NOT NULL REFERENCES methodologies(id) ON DELETE CASCADE,

  -- Whether this methodology is enabled for the user
  is_enabled BOOLEAN DEFAULT true,

  -- Whether this is the user's active/primary methodology
  is_primary BOOLEAN DEFAULT false,

  -- User's skill level with this methodology (drives AI coaching depth)
  proficiency_level TEXT DEFAULT 'beginner'
    CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),

  -- When the user first enabled this methodology
  started_at TIMESTAMPTZ DEFAULT now(),

  -- When the user last actively used this methodology
  last_used_at TIMESTAMPTZ,

  -- Spaced repetition: when to next prompt the user for review
  next_review_at TIMESTAMPTZ,

  -- One preference per user per methodology
  UNIQUE (user_id, methodology_id)
);

-- Enable Row Level Security
ALTER TABLE user_methodology_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Critical constraint: exactly one primary methodology per user
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_user
  ON user_methodology_preferences (user_id) WHERE is_primary = true;

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_methodology_prefs_user
  ON user_methodology_preferences (user_id);

CREATE INDEX IF NOT EXISTS idx_user_methodology_prefs_methodology
  ON user_methodology_preferences (methodology_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Users can read their own preferences
DROP POLICY IF EXISTS "Users can read own methodology prefs" ON user_methodology_preferences;
CREATE POLICY "Users can read own methodology prefs"
  ON user_methodology_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own preferences
DROP POLICY IF EXISTS "Users can create own methodology prefs" ON user_methodology_preferences;
CREATE POLICY "Users can create own methodology prefs"
  ON user_methodology_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own methodology prefs" ON user_methodology_preferences;
CREATE POLICY "Users can update own methodology prefs"
  ON user_methodology_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own preferences
DROP POLICY IF EXISTS "Users can delete own methodology prefs" ON user_methodology_preferences;
CREATE POLICY "Users can delete own methodology prefs"
  ON user_methodology_preferences FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all preferences (for analytics)
DROP POLICY IF EXISTS "Admins can read all methodology prefs" ON user_methodology_preferences;
CREATE POLICY "Admins can read all methodology prefs"
  ON user_methodology_preferences FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

COMMENT ON TABLE user_methodology_preferences IS 'Per-user methodology enablement with proficiency tracking and one-primary constraint';
