-- ============================================================================
-- Migration: 20260213000008_create_webhook_events
-- Purpose: Log all incoming webhook events from external services.
--
-- SAIL receives webhooks from:
--   - Stripe: subscription events (payment success, cancellation, etc.)
--   - Skool: community membership changes (join, leave, etc.)
--   - Zoho: CRM sync events (contact updates, deal changes, etc.)
--
-- Every webhook is logged with its full payload for:
--   - Debugging failed webhook processing
--   - Replaying missed events
--   - Audit trail of external events
--
-- Status tracks processing state:
--   - 'received': webhook logged but not yet processed
--   - 'processed': successfully handled
--   - 'failed': processing failed (see error_message for details)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  -- Unique identifier for each webhook event
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which external service sent this webhook
  source TEXT NOT NULL CHECK (source IN ('stripe', 'skool', 'zoho')),

  -- The event type from the webhook (e.g., 'checkout.session.completed')
  event_type TEXT NOT NULL,

  -- The full webhook payload stored as JSONB for complete audit trail
  payload JSONB NOT NULL DEFAULT '{}',

  -- Processing status — tracks whether we've handled this event
  status TEXT NOT NULL CHECK (
    status IN ('received', 'processed', 'failed')
  ) DEFAULT 'received',

  -- Error details if processing failed (null on success)
  error_message TEXT,

  -- When the webhook was received
  created_at TIMESTAMPTZ DEFAULT now(),

  -- When the webhook was processed (null if still pending)
  processed_at TIMESTAMPTZ
);

-- Enable Row Level Security — required on every table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Admins can read webhook events
-- Used in the admin panel for monitoring webhook health
CREATE POLICY "Admins can read webhook events"
  ON webhook_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Allow inserts via service role
-- Webhooks are received by API routes using the service role.
-- Service role bypasses RLS, but we add a permissive policy as a fallback.
CREATE POLICY "Allow webhook event inserts"
  ON webhook_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow updates for processing status changes
-- After a webhook is processed, its status is updated to 'processed' or 'failed'
CREATE POLICY "Admins can update webhook events"
  ON webhook_events
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

-- Add a comment on the table for documentation
COMMENT ON TABLE webhook_events IS 'Incoming webhook event log — stores full payloads from Stripe, Skool, and Zoho';
