-- ============================================================================
-- Migration: 20260213000009_create_email_conversations
-- Purpose: Email composition chat history for the AI Email Composition feature.
--
-- When users compose prospect outreach emails using the AI assistant,
-- the conversation (user prompts + AI responses) is stored here along
-- with the final draft email. This allows users to:
--   - Resume email drafting sessions
--   - Review past email compositions
--   - Reference previous communication context
--
-- Migrated from the legacy system — preserves the original data shape.
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_conversations (
  -- Unique identifier for each email conversation
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user owns this conversation — cascades on user deletion
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User-facing title for the conversation (e.g., "Outreach to Dance Studio X")
  title TEXT,

  -- The full chat history stored as a JSONB array of message objects
  -- Each message: { "role": "user"|"assistant", "content": "...", "timestamp": "..." }
  messages JSONB DEFAULT '[]',

  -- The final draft email produced by the AI
  -- Stored separately for quick access without parsing the full conversation
  draft_email TEXT,

  -- Any previous communication context the user provided
  -- (e.g., "They replied to my first email saying they're interested")
  previous_communication TEXT,

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE email_conversations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own email conversations
CREATE POLICY "Users can read own email conversations"
  ON email_conversations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create new email conversations
CREATE POLICY "Users can create own email conversations"
  ON email_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own email conversations
CREATE POLICY "Users can update own email conversations"
  ON email_conversations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own email conversations
CREATE POLICY "Users can delete own email conversations"
  ON email_conversations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add a comment on the table for documentation
COMMENT ON TABLE email_conversations IS 'AI email composition chat history — stores drafting sessions and final email drafts';
