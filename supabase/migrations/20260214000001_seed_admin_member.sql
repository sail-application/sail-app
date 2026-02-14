-- ============================================================================
-- Migration: 20260214000001_seed_admin_member
-- Purpose: Ensure the platform owner (Alex) is always in the authorized_members
--          table. The seed.sql file only runs during `db reset`, not in
--          production deploys, so this migration guarantees access.
--
-- Uses ON CONFLICT DO NOTHING so it's safe to run even if the record exists.
-- ============================================================================

INSERT INTO authorized_members (email, skool_username, is_active) VALUES
  ('alex@sapicture.day', 'AlexSAPictureDay', true)
ON CONFLICT (email) DO NOTHING;
