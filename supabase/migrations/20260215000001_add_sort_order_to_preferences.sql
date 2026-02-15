-- Add sort_order to user_methodology_preferences
-- Allows users to set a personal ordering for their methodology cards.
-- Default 0 means "use the org-wide sort_order from methodologies table".

ALTER TABLE user_methodology_preferences ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_methodology_prefs_sort
  ON user_methodology_preferences (user_id, sort_order);
