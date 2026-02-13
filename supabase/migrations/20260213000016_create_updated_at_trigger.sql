-- ============================================================================
-- Migration: 20260213000016_create_updated_at_trigger
-- Purpose: Reusable trigger function for auto-updating updated_at columns.
--
-- Many tables in SAIL have an updated_at column that should automatically
-- reflect when a row was last modified. Instead of relying on application
-- code to set this (which is error-prone), this database trigger handles
-- it automatically on every UPDATE.
--
-- The trigger function is created once and then applied to every table
-- that has an updated_at column. This keeps it DRY and consistent.
-- ============================================================================

-- ============================================================================
-- Trigger Function: set_updated_at()
-- Automatically sets updated_at to the current timestamp on row update.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set the updated_at column to the current timestamp
  -- NEW refers to the row being updated
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add a comment on the function for documentation
COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger function: auto-updates the updated_at column to now() on every row update';

-- ============================================================================
-- Apply the trigger to all tables that have an updated_at column.
-- Each trigger fires BEFORE UPDATE so the timestamp is set before the
-- row is written to disk.
-- ============================================================================

-- authorized_members: Skool whitelist entries
DROP TRIGGER IF EXISTS set_updated_at ON authorized_members;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON authorized_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- user_profiles: Extended user profile data
DROP TRIGGER IF EXISTS set_updated_at ON user_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- app_settings: Admin-managed key-value configuration
DROP TRIGGER IF EXISTS set_updated_at ON app_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ai_provider_config: Per-feature AI provider settings
DROP TRIGGER IF EXISTS set_updated_at ON ai_provider_config;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ai_provider_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- email_conversations: Email composition chat history
DROP TRIGGER IF EXISTS set_updated_at ON email_conversations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON email_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- call_history: Call recordings and analysis
DROP TRIGGER IF EXISTS set_updated_at ON call_history;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON call_history
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- user_notes: Notes linked to calls
DROP TRIGGER IF EXISTS set_updated_at ON user_notes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- strategies: Paul Cherry methodology content
DROP TRIGGER IF EXISTS set_updated_at ON strategies;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- feature_flags: Feature flag toggles
DROP TRIGGER IF EXISTS set_updated_at ON feature_flags;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
