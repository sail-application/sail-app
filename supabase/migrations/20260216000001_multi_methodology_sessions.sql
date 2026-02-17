-- ============================================================================
-- Migration: 20260216000001_multi_methodology_sessions
-- Purpose: Enable multi-methodology session support.
--
-- Changes:
--   1. Drop the one-primary-per-user constraint on user_methodology_preferences.
--      Users can now mark multiple methodologies as "primary" — this concept
--      is superseded by per-session methodology selection in session_configurations.
--
--   2. Create session_configurations table: stores per-session methodology
--      selection so users can mix frameworks (e.g., BANT + MEDPIC together).
--
-- This is part of the SAIL pivot from photography-specific → universal
-- conversation coaching platform (2026-02-16 Samuel Rubashkin meeting).
-- ============================================================================

-- ── 1. Remove the one-primary-per-user constraint ──────────────────────────
-- With multi-methodology sessions, a user may want multiple "active" frameworks.
-- The concept of a single primary is replaced by per-session configuration.

DROP INDEX IF EXISTS idx_one_primary_per_user;

-- ── 2. Session configurations table ────────────────────────────────────────
-- Stores saved session setups: which methodologies to use, what context pack
-- to apply, and optional name for reuse. One configuration can be the default
-- for that session type.

CREATE TABLE IF NOT EXISTS session_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user who owns this configuration
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which SAIL feature this config applies to
  session_type TEXT NOT NULL CHECK (session_type IN ('practice', 'live-call', 'analyzer')),

  -- Array of methodology IDs active in this session (empty = use user's default)
  methodology_ids UUID[] NOT NULL DEFAULT '{}',

  -- Optional industry context pack (Phase 4 — null until context packs are created)
  context_pack_id UUID,  -- FK added in Phase 4 migration after context_packs table exists

  -- Human-readable name for saved configs (e.g., "BANT + MEDPIC for SaaS")
  name TEXT,

  -- Whether this is the default config shown when opening this session type
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE session_configurations ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ────────────────────────────────────────────────────────────

-- Users can read their own session configurations
CREATE POLICY "Users can read own session configs"
  ON session_configurations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own session configurations
CREATE POLICY "Users can create own session configs"
  ON session_configurations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own session configurations
CREATE POLICY "Users can update own session configs"
  ON session_configurations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own session configurations
CREATE POLICY "Users can delete own session configs"
  ON session_configurations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Fast lookup of a user's configs by session type
CREATE INDEX IF NOT EXISTS idx_session_configs_user_type
  ON session_configurations (user_id, session_type);

-- Partial index: quickly find the default config per user per session type
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_configs_default
  ON session_configurations (user_id, session_type)
  WHERE is_default = true;

-- Trigger to auto-update updated_at (uses the shared trigger function from migration 20260213000016)
DROP TRIGGER IF EXISTS set_session_configurations_updated_at ON session_configurations;
CREATE TRIGGER set_session_configurations_updated_at
  BEFORE UPDATE ON session_configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE session_configurations IS 'Per-user saved session setups with multi-methodology selection and optional context pack';
