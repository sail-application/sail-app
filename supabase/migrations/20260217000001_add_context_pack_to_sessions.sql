-- Add context_pack_id to practice_sessions and live_call_sessions.
-- This links sessions to an industry context pack (optional).
-- ON DELETE SET NULL means deleting a pack won't remove session history.

ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS context_pack_id UUID REFERENCES context_packs(id) ON DELETE SET NULL;

ALTER TABLE live_call_sessions
  ADD COLUMN IF NOT EXISTS context_pack_id UUID REFERENCES context_packs(id) ON DELETE SET NULL;
