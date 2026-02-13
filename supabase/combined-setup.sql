-- ============================================================================
-- SAIL — Sales AI Learning Platform
-- Combined Database Setup Script
-- ============================================================================
--
-- This file combines all 16 Supabase migration files and the seed data into
-- a single SQL script that can be pasted directly into the Supabase SQL Editor.
--
-- It creates the complete SAIL database schema including:
--   - 14 tables with Row Level Security (RLS) policies
--   - 2 trigger functions (handle_new_user, set_updated_at)
--   - Indexes for query performance
--   - Seed data (authorized members, strategies, feature flags, AI config)
--
-- Migration files included (in order):
--   01. authorized_members   — Skool community email whitelist
--   02. user_roles            — RBAC role assignments
--   03. user_profiles         — Extended user profiles + signup trigger
--   04. app_settings          — Key-value configuration store
--   05. ai_provider_config    — Per-feature AI provider settings
--   06. token_usage_logs      — AI token consumption tracking
--   07. audit_logs            — Admin action audit trail
--   08. webhook_events        — External webhook event log
--   09. email_conversations   — AI email composition chat history
--   10. call_history          — Call recordings and analysis
--   11. user_notes            — User notes linked to calls
--   12. practice_sessions     — AI roleplay training sessions
--   13. strategies            — Paul Cherry methodology content
--   14. feature_flags         — Feature rollout toggles
--   15. background_jobs       — Async job queue
--   16. updated_at trigger    — Auto-update timestamps on all tables
--
-- Followed by: seed.sql — Initial data for dev/testing
--
-- Generated on: 2026-02-13
-- ============================================================================


-- ############################################################################
-- MIGRATION 01: 20260213000001_create_authorized_members.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000001_create_authorized_members
-- Purpose: Skool community email whitelist for SAIL access gating.
--
-- SAIL is gated to SA Picture Day's Skool community members only.
-- During the auth callback (Google OAuth → Supabase), the system checks
-- this table to verify the user's email is whitelisted and is_active = true.
-- If not found or inactive, signup/login is rejected.
--
-- Admin users manage this table via the admin panel.
-- The service role is used during auth callback checks (bypasses RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS authorized_members (
  -- Unique identifier for each whitelist entry
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The email address that is authorized to access SAIL
  -- Must be unique — one entry per email
  email TEXT NOT NULL UNIQUE,

  -- Optional: the member's Skool community username for reference
  skool_username TEXT,

  -- Whether this member is currently allowed access
  -- Set to false to revoke access without deleting the record
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Which admin added this member (nullable for seed/import data)
  added_by UUID REFERENCES auth.users(id),

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE authorized_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Admins can view all authorized members
-- Used in the admin panel to manage the whitelist
CREATE POLICY "Admins can view authorized members"
  ON authorized_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can insert new authorized members
CREATE POLICY "Admins can insert authorized members"
  ON authorized_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update authorized members (e.g., toggle is_active)
CREATE POLICY "Admins can update authorized members"
  ON authorized_members
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

-- Policy: Admins can delete authorized members
CREATE POLICY "Admins can delete authorized members"
  ON authorized_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Note: The service role (used during auth callbacks) bypasses RLS entirely,
-- so no explicit policy is needed for the auth check flow.

-- Add a comment on the table for documentation
COMMENT ON TABLE authorized_members IS 'Skool community email whitelist — controls who can access SAIL';


-- ############################################################################
-- MIGRATION 02: 20260213000002_create_user_roles.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000002_create_user_roles
-- Purpose: Role-Based Access Control (RBAC) for SAIL users.
--
-- Every authenticated user gets exactly one role:
--   - admin: Full access to all features, settings, and user management
--   - team_lead: Can manage their team's reps and view team analytics
--   - rep: Standard sales rep — access to core features only
--
-- Default role is 'rep'. Admins can promote users via the admin panel.
-- The user_id column has a UNIQUE constraint — one role per user.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  -- Unique identifier for each role assignment
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user this role belongs to — cascades on user deletion
  -- UNIQUE ensures one role per user (no multi-role complexity)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- The role assigned to this user
  -- CHECK constraint enforces only valid roles
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_lead', 'rep')) DEFAULT 'rep',

  -- Which admin assigned this role (nullable for auto-created roles)
  assigned_by UUID REFERENCES auth.users(id),

  -- When this role was created
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own role
-- Needed so the app can check the current user's permissions
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can read all roles
-- Needed for the admin panel user management
CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Policy: Admins can insert new roles
-- Used when new users are created or roles are manually assigned
CREATE POLICY "Admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Policy: Admins can update roles (e.g., promote rep → team_lead)
CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Policy: Admins can delete roles
CREATE POLICY "Admins can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles AS ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Add a comment on the table for documentation
COMMENT ON TABLE user_roles IS 'RBAC role assignments — one role per user (admin, team_lead, rep)';


-- ############################################################################
-- MIGRATION 03: 20260213000003_create_user_profiles.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000003_create_user_profiles
-- Purpose: Extended user profiles for SAIL users.
--
-- This table stores additional user information beyond what Supabase Auth
-- provides (which is just email and auth metadata). Profiles are auto-created
-- via a database trigger when a new user signs up through auth.users.
--
-- The trigger also creates a default 'rep' role in user_roles.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  -- Uses the auth.users ID as the primary key (1:1 relationship)
  -- Cascades on user deletion so profiles are cleaned up automatically
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Display name (pulled from Google OAuth on first login, editable after)
  full_name TEXT,

  -- Profile picture URL (pulled from Google OAuth, can be updated)
  avatar_url TEXT,

  -- Optional phone number for the user
  phone TEXT,

  -- The company/organization the user belongs to
  company TEXT,

  -- Whether the user has completed the onboarding flow
  -- Used to redirect new users to onboarding on first login
  onboarding_completed BOOLEAN DEFAULT false,

  -- Tracks when the user was last active in the app
  -- Updated periodically by the frontend or middleware
  last_active_at TIMESTAMPTZ DEFAULT now(),

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Admins can read all profiles
-- Needed for admin panel user management and team views
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Allow inserts for the trigger function (runs as SECURITY DEFINER)
-- The trigger runs with elevated privileges, but we also allow service role
-- inserts for edge cases like manual user creation
CREATE POLICY "Service role can insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- Trigger: Auto-create profile and role on new user signup
-- ============================================================================

-- This function runs automatically when a new row is inserted into auth.users.
-- It creates:
--   1. A user_profiles row with name/avatar from the OAuth metadata
--   2. A user_roles row with the default 'rep' role
--
-- SECURITY DEFINER means it runs with the privileges of the function owner
-- (postgres), bypassing RLS. This is necessary because the new user doesn't
-- have any roles yet when they first sign up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create the user profile with data from the OAuth provider
  -- raw_user_meta_data contains Google OAuth fields like full_name and avatar_url
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- Assign the default 'rep' role to the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'rep');

  RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users so it fires on every new signup
-- Using IF NOT EXISTS pattern: drop first to make migration idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add a comment on the table for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profiles — auto-created on signup via trigger';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function: creates profile + default role when a new user signs up';


-- ############################################################################
-- MIGRATION 04: 20260213000004_create_app_settings.sql
-- ############################################################################

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


-- ############################################################################
-- MIGRATION 05: 20260213000005_create_ai_provider_config.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000005_create_ai_provider_config
-- Purpose: Per-feature AI provider configuration for the provider-agnostic
--          AI abstraction layer.
--
-- SAIL supports multiple AI providers (Gemini, Claude, OpenAI, DeepSeek).
-- Each of the 5 core AI features can be independently configured to use
-- a different provider, model, and settings. This allows:
--   - Hot-swapping providers without code changes
--   - Per-feature optimization (fast models for real-time, smart for analysis)
--   - Easy A/B testing between providers
--
-- Default config:
--   - Real-time features (live-call, practice) → Gemini 2.0 Flash (speed)
--   - Analytical features (email, analyzer, strategies) → Gemini 2.5 Pro (quality)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_provider_config (
  -- Unique identifier for each config entry
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which feature this config applies to
  -- UNIQUE ensures exactly one config per feature
  feature TEXT NOT NULL UNIQUE CHECK (
    feature IN ('live-call', 'practice', 'email', 'analyzer', 'strategies')
  ),

  -- The AI provider to use for this feature
  provider TEXT NOT NULL CHECK (
    provider IN ('gemini', 'claude', 'openai', 'deepseek')
  ) DEFAULT 'gemini',

  -- The specific model identifier (provider-specific)
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',

  -- Maximum tokens to generate in responses
  max_tokens INTEGER DEFAULT 2048,

  -- Temperature controls randomness (0.00 = deterministic, 1.00 = creative)
  -- NUMERIC(3,2) allows values like 0.70, 0.50, 1.00
  temperature NUMERIC(3,2) DEFAULT 0.70,

  -- Whether this feature's AI is currently enabled
  -- Set to false to disable AI for a feature without removing config
  is_active BOOLEAN DEFAULT true,

  -- Which admin last modified this config
  updated_by UUID REFERENCES auth.users(id),

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE ai_provider_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: All authenticated users can read AI config
-- The AI abstraction layer needs to read config to route requests
CREATE POLICY "Authenticated users can read AI config"
  ON ai_provider_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can insert AI config
CREATE POLICY "Admins can insert AI config"
  ON ai_provider_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update AI config (change providers, models, settings)
CREATE POLICY "Admins can update AI config"
  ON ai_provider_config
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

-- Policy: Admins can delete AI config
CREATE POLICY "Admins can delete AI config"
  ON ai_provider_config
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
-- Seed: Default AI provider config for all 5 features
-- ============================================================================

-- Real-time features use Gemini 2.0 Flash for sub-2s latency
-- Analytical features use Gemini 2.5 Pro for higher quality output
INSERT INTO ai_provider_config (feature, provider, model, max_tokens, temperature) VALUES
  ('live-call',   'gemini', 'gemini-2.0-flash', 1024,  0.30),
  ('practice',    'gemini', 'gemini-2.0-flash', 2048,  0.70),
  ('email',       'gemini', 'gemini-2.5-pro',   4096,  0.50),
  ('analyzer',    'gemini', 'gemini-2.5-pro',   4096,  0.30),
  ('strategies',  'gemini', 'gemini-2.5-pro',   2048,  0.50)
ON CONFLICT (feature) DO NOTHING;

-- Add a comment on the table for documentation
COMMENT ON TABLE ai_provider_config IS 'Per-feature AI provider settings — controls which model handles each SAIL feature';


-- ############################################################################
-- MIGRATION 06: 20260213000006_create_token_usage_logs.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000006_create_token_usage_logs
-- Purpose: Track AI token consumption per feature per user.
--
-- Every AI request logs its token usage here for:
--   - Cost tracking and budgeting (tokens → dollars)
--   - Per-user usage analytics
--   - Per-feature usage patterns
--   - Latency monitoring
--   - Rate limiting decisions
--
-- This table is append-only (insert-heavy, no updates).
-- The service role handles inserts from API routes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_usage_logs (
  -- Unique identifier for each usage log entry
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user made the AI request
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Which feature generated this usage (live-call, practice, email, etc.)
  feature TEXT NOT NULL,

  -- Which AI provider was used
  provider TEXT NOT NULL,

  -- Which specific model was used
  model TEXT NOT NULL,

  -- Token counts — prompt is input, completion is output
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- How long the AI request took in milliseconds
  -- Useful for monitoring latency SLAs (e.g., live-call must be <2000ms)
  latency_ms INTEGER,

  -- When this usage occurred
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE token_usage_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Index on user_id: for querying a specific user's usage history
CREATE INDEX idx_token_usage_logs_user_id ON token_usage_logs(user_id);

-- Index on feature: for per-feature usage aggregation
CREATE INDEX idx_token_usage_logs_feature ON token_usage_logs(feature);

-- Index on created_at: for time-range queries (daily/weekly/monthly reports)
CREATE INDEX idx_token_usage_logs_created_at ON token_usage_logs(created_at);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own token usage
-- Shown on the user's dashboard for personal usage tracking
CREATE POLICY "Users can read own token usage"
  ON token_usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can read all token usage
-- Needed for the admin cost dashboard and usage analytics
CREATE POLICY "Admins can read all token usage"
  ON token_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Allow inserts for logging
-- Service role bypasses RLS for server-side inserts, but we also allow
-- authenticated inserts with a permissive WITH CHECK for edge cases
-- where the API route runs in the user's context
CREATE POLICY "Allow token usage inserts"
  ON token_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add a comment on the table for documentation
COMMENT ON TABLE token_usage_logs IS 'AI token consumption logs — tracks usage per feature per user for cost monitoring';


-- ############################################################################
-- MIGRATION 07: 20260213000007_create_audit_logs.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000007_create_audit_logs
-- Purpose: Admin action tracking and audit trail.
--
-- Records significant administrative actions for security and compliance:
--   - User role changes
--   - Settings modifications
--   - Member whitelist changes
--   - AI config updates
--   - Feature flag toggles
--
-- This table is append-only. Records should never be updated or deleted
-- to maintain audit integrity. The service role handles inserts from
-- server-side API routes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  -- Unique identifier for each audit entry
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user performed the action
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- What action was performed (e.g., 'update_role', 'toggle_feature_flag')
  action TEXT NOT NULL,

  -- What type of resource was affected (e.g., 'user_role', 'app_setting')
  resource_type TEXT NOT NULL,

  -- The specific resource ID that was affected (nullable for bulk actions)
  resource_id TEXT,

  -- Additional context about the action stored as JSONB
  -- e.g., { "old_role": "rep", "new_role": "team_lead" }
  details JSONB DEFAULT '{}',

  -- The IP address of the request (for security auditing)
  ip_address TEXT,

  -- When this action occurred
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Index on user_id: for finding all actions by a specific admin
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Index on created_at: for chronological audit trail queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Admins can read audit logs
-- Only admins should be able to review the audit trail
CREATE POLICY "Admins can read audit logs"
  ON audit_logs
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
-- Audit logs are inserted server-side; service role bypasses RLS.
-- We also allow authenticated inserts for API routes running in user context.
CREATE POLICY "Allow audit log inserts"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add a comment on the table for documentation
COMMENT ON TABLE audit_logs IS 'Admin action audit trail — append-only log of significant actions for security';


-- ############################################################################
-- MIGRATION 08: 20260213000008_create_webhook_events.sql
-- ############################################################################

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


-- ############################################################################
-- MIGRATION 09: 20260213000009_create_email_conversations.sql
-- ############################################################################

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


-- ############################################################################
-- MIGRATION 10: 20260213000010_create_call_history.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000010_create_call_history
-- Purpose: Call recordings and post-call analysis from the Call Analyzer feature.
--
-- After a user completes a sales call (or uploads a recording), the Call
-- Analyzer processes it and stores:
--   - Full transcript of the call
--   - AI-generated summary and actionable suggestions
--   - Score based on Paul Cherry methodology effectiveness
--   - Pinned insights the user wants to remember
--   - AI-generated follow-up email draft
--
-- Migrated from the legacy system — preserves the original data shape.
-- ============================================================================

CREATE TABLE IF NOT EXISTS call_history (
  -- Unique identifier for each call record
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user owns this call — cascades on user deletion
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Call duration in seconds
  duration INTEGER,

  -- Full text transcript of the call
  transcript TEXT,

  -- AI-generated call summary stored as JSONB
  -- e.g., { "overview": "...", "key_topics": [...], "outcome": "..." }
  summary JSONB DEFAULT '{}',

  -- AI-generated improvement suggestions stored as JSONB array
  -- e.g., [{ "area": "questioning", "suggestion": "...", "priority": "high" }]
  suggestions JSONB DEFAULT '[]',

  -- User-pinned insights from the call stored as JSONB array
  -- e.g., [{ "text": "...", "timestamp": "2:34", "category": "objection" }]
  pinned_insights JSONB DEFAULT '[]',

  -- Overall effectiveness score (0.00 to 100.00)
  -- Based on Paul Cherry methodology adherence
  score NUMERIC(5,2),

  -- AI-generated follow-up email based on the call
  follow_up_email TEXT,

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Index on user_id: for fetching a user's call history
CREATE INDEX idx_call_history_user_id ON call_history(user_id);

-- Index on created_at: for chronological call history queries
CREATE INDEX idx_call_history_created_at ON call_history(created_at);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own call history
CREATE POLICY "Users can read own call history"
  ON call_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create new call records
CREATE POLICY "Users can create own call history"
  ON call_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own call records (e.g., pin insights)
CREATE POLICY "Users can update own call history"
  ON call_history
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own call records
CREATE POLICY "Users can delete own call history"
  ON call_history
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add a comment on the table for documentation
COMMENT ON TABLE call_history IS 'Call recordings and post-call analysis — stores transcripts, scores, and AI suggestions';


-- ############################################################################
-- MIGRATION 11: 20260213000011_create_user_notes.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000011_create_user_notes
-- Purpose: User notes that can be linked to specific calls.
--
-- Users can create notes for various purposes:
--   - Post-call reflections linked to a specific call_history record
--   - General sales strategy notes
--   - AI-generated insights saved for later reference
--   - Study notes from the Strategies Library
--
-- Notes can be starred for quick access, categorized by source/type,
-- and tagged with skill areas for filtering.
--
-- Migrated from the legacy system — preserves the original data shape.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notes (
  -- Unique identifier for each note
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user owns this note — cascades on user deletion
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Note title (optional — can be auto-generated or user-provided)
  title TEXT,

  -- The main note content (free-form text)
  content TEXT,

  -- Where this note originated from
  -- e.g., 'call_analyzer', 'practice', 'manual', 'strategies'
  source TEXT,

  -- Whether the user has starred/favorited this note
  starred BOOLEAN DEFAULT false,

  -- Call segment this note relates to (e.g., 'opening', 'discovery', 'closing')
  segment TEXT,

  -- Skill area this note relates to (e.g., 'objection_handling', 'questioning')
  skill TEXT,

  -- Type of call this note is about (e.g., 'cold_call', 'follow_up', 'demo')
  call_type TEXT,

  -- AI-generated insight or suggestion associated with this note
  ai_insight TEXT,

  -- Optional link to a specific call record
  -- SET NULL on deletion so the note persists even if the call is deleted
  linked_call_id UUID REFERENCES call_history(id) ON DELETE SET NULL,

  -- Display name of the linked call (cached to avoid joins)
  linked_call_name TEXT,

  -- When the user last viewed this note (for "recently viewed" queries)
  last_viewed_at TIMESTAMPTZ,

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own notes
CREATE POLICY "Users can read own notes"
  ON user_notes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create new notes
CREATE POLICY "Users can create own notes"
  ON user_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON user_notes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON user_notes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add a comment on the table for documentation
COMMENT ON TABLE user_notes IS 'User notes — can be linked to calls, starred, and categorized by skill/source';


-- ############################################################################
-- MIGRATION 12: 20260213000012_create_practice_sessions.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000012_create_practice_sessions
-- Purpose: Practice mode session tracking for AI roleplay training.
--
-- Practice Mode is one of SAIL's core features. Users roleplay sales calls
-- with an AI persona (e.g., a dance studio owner, school principal) and
-- receive real-time coaching feedback.
--
-- Each session tracks:
--   - The persona type and difficulty level
--   - Complete conversation transcript (messages)
--   - AI-generated feedback and score
--   - Which commitment stage the user reached (Paul Cherry methodology)
--
-- Commitment stages follow Paul Cherry's "Questions That Sell" framework:
--   - 'sure': Prospect is open but uncommitted
--   - 'want-to': Prospect wants the service but hasn't committed
--   - 'have-to': Prospect feels urgency and commits
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_sessions (
  -- Unique identifier for each practice session
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user completed this session — cascades on user deletion
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The AI persona type the user practiced with
  persona_type TEXT CHECK (
    persona_type IN ('principal', 'administrator', 'dance', 'daycare', 'sports')
  ),

  -- Difficulty level of the practice scenario
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),

  -- Overall session score (0.00 to 100.00)
  score NUMERIC(5,2),

  -- How long the session lasted in seconds
  duration_seconds INTEGER,

  -- Full conversation transcript stored as JSONB array
  -- Each message: { "role": "user"|"assistant"|"coach", "content": "...", "timestamp": "..." }
  messages JSONB DEFAULT '[]',

  -- AI-generated session feedback stored as JSONB
  -- e.g., { "strengths": [...], "improvements": [...], "tips": [...] }
  feedback JSONB DEFAULT '{}',

  -- The highest commitment stage the user reached during the session
  -- Tracks progress through Paul Cherry's methodology
  commitment_stage TEXT CHECK (
    commitment_stage IN ('sure', 'want-to', 'have-to')
  ),

  -- When this session occurred
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can read their own practice sessions
CREATE POLICY "Users can read own practice sessions"
  ON practice_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create new practice sessions
CREATE POLICY "Users can create own practice sessions"
  ON practice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own sessions (e.g., update score at end)
CREATE POLICY "Users can update own practice sessions"
  ON practice_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own practice sessions"
  ON practice_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add a comment on the table for documentation
COMMENT ON TABLE practice_sessions IS 'Practice mode sessions — AI roleplay training with scoring and commitment stage tracking';


-- ############################################################################
-- MIGRATION 13: 20260213000013_create_strategies.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000013_create_strategies
-- Purpose: Paul Cherry methodology content for the Strategies Library.
--
-- The Strategies Library is a searchable collection of sales techniques
-- based on Paul Cherry's "Questions That Sell" methodology. Content is
-- organized by category and can include:
--   - Technique descriptions and explanations
--   - Example questions and scripts
--   - Prompt types for AI coaching integration
--   - Tags for search and filtering
--
-- Admins manage this content. All authenticated users can read it.
-- ============================================================================

CREATE TABLE IF NOT EXISTS strategies (
  -- Unique identifier for each strategy
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Strategy title (e.g., "Lock-On Questions")
  title TEXT NOT NULL,

  -- Category for grouping (e.g., "questioning", "objection_handling", "closing")
  category TEXT NOT NULL,

  -- Short description/summary of the strategy
  description TEXT,

  -- Full content/explanation of the strategy
  content TEXT NOT NULL,

  -- Optional: prompt type for AI integration
  -- Used to link strategies to specific AI coaching behaviors
  prompt_type TEXT,

  -- Example scripts/questions stored as JSONB array
  -- e.g., [{ "scenario": "...", "question": "...", "why": "..." }]
  examples JSONB DEFAULT '[]',

  -- Tags for search and filtering (PostgreSQL text array)
  -- e.g., {'discovery', 'opening', 'paul-cherry'}
  tags TEXT[] DEFAULT '{}',

  -- Display order within the category (lower = shown first)
  sort_order INTEGER DEFAULT 0,

  -- Whether this strategy is visible to users
  -- Set to false to hide without deleting
  is_active BOOLEAN DEFAULT true,

  -- Timestamps for record tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: All authenticated users can read active strategies
CREATE POLICY "Authenticated users can read strategies"
  ON strategies
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can insert new strategies
CREATE POLICY "Admins can insert strategies"
  ON strategies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update strategies
CREATE POLICY "Admins can update strategies"
  ON strategies
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

-- Policy: Admins can delete strategies
CREATE POLICY "Admins can delete strategies"
  ON strategies
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
COMMENT ON TABLE strategies IS 'Paul Cherry methodology content — searchable sales techniques for the Strategies Library';


-- ############################################################################
-- MIGRATION 14: 20260213000014_create_feature_flags.sql
-- ############################################################################

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


-- ############################################################################
-- MIGRATION 15: 20260213000015_create_background_jobs.sql
-- ############################################################################

-- ============================================================================
-- Migration: 20260213000015_create_background_jobs
-- Purpose: Async job queue for background processing tasks.
--
-- SAIL uses background jobs for tasks that shouldn't block the user:
--   - Processing uploaded call recordings
--   - Syncing data with Zoho Bigin CRM
--   - Bulk email composition
--   - Generating aggregate analytics
--   - Skool community membership sync
--
-- Jobs follow a simple state machine:
--   pending → processing → completed
--                        → failed (retries up to max_attempts)
--
-- A Supabase Edge Function (or pg_cron) polls this table for pending
-- jobs and processes them. The scheduled_for column allows delayed execution.
-- ============================================================================

CREATE TABLE IF NOT EXISTS background_jobs (
  -- Unique identifier for each job
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job type identifier (e.g., 'process_call', 'sync_crm', 'send_email')
  type TEXT NOT NULL,

  -- Job parameters stored as JSONB
  -- Contents depend on the job type
  -- e.g., { "call_id": "...", "user_id": "..." }
  payload JSONB DEFAULT '{}',

  -- Current job status — tracks the state machine progression
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ) DEFAULT 'pending',

  -- How many times this job has been attempted
  -- Incremented each time processing starts
  attempts INTEGER DEFAULT 0,

  -- Maximum retry attempts before permanently marking as failed
  max_attempts INTEGER DEFAULT 3,

  -- Error details if the job failed (null on success)
  error_message TEXT,

  -- When this job should be processed (allows delayed/scheduled jobs)
  -- Default is now() for immediate processing
  scheduled_for TIMESTAMPTZ DEFAULT now(),

  -- When processing started (null if still pending)
  started_at TIMESTAMPTZ,

  -- When processing completed or failed (null if still in progress)
  completed_at TIMESTAMPTZ,

  -- When this job was created
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security — required on every table
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Composite index on status + scheduled_for: used by the job poller
-- to efficiently find the next pending job that's ready to run
CREATE INDEX idx_background_jobs_status_scheduled
  ON background_jobs(status, scheduled_for)
  WHERE status = 'pending';

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Admins can read all jobs (for monitoring in admin panel)
CREATE POLICY "Admins can read background jobs"
  ON background_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Allow inserts for creating new jobs
-- Jobs are created by API routes. Service role bypasses RLS for server-side
-- creation, but we allow authenticated inserts as a fallback.
CREATE POLICY "Allow background job inserts"
  ON background_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow updates for processing status changes
-- The job worker updates status, attempts, error_message, started_at, completed_at.
-- Service role handles most updates, but admins can also retry failed jobs.
CREATE POLICY "Admins can update background jobs"
  ON background_jobs
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
COMMENT ON TABLE background_jobs IS 'Async job queue — tracks background tasks with retry logic and scheduling';


-- ############################################################################
-- MIGRATION 16: 20260213000016_create_updated_at_trigger.sql
-- ############################################################################

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


-- ############################################################################
-- SEED DATA: supabase/seed.sql
-- ############################################################################

-- ============================================================================
-- Seed Data for SAIL — Sales AI Learning Platform
-- Purpose: Populate the database with initial data for development and testing.
--
-- This seed file is idempotent — it uses ON CONFLICT DO NOTHING so it can
-- be run multiple times without creating duplicates.
--
-- Run with: npx supabase db reset (applies migrations + seed)
-- ============================================================================

-- ============================================================================
-- 1. Authorized Members — Skool community whitelist
-- ============================================================================
-- Add the primary admin (Alex, SA Picture Day owner) to the whitelist
INSERT INTO authorized_members (email, skool_username, is_active) VALUES
  ('alex@sapicture.day', 'AlexSAPictureDay', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. Strategies — Paul Cherry "Questions That Sell" methodology content
-- ============================================================================
-- These are the core sales techniques that SAIL teaches users

INSERT INTO strategies (title, category, description, content, prompt_type, examples, tags, sort_order, is_active) VALUES

  -- Strategy 1: Lock-On Questions
  (
    'Lock-On Questions',
    'questioning',
    'Build on the prospect''s own words to deepen the conversation and show active listening.',
    'Lock-On Questions are a powerful technique from Paul Cherry''s "Questions That Sell." The idea is simple: take something the prospect just said and build your next question around their exact words. This shows you''re actively listening and creates a natural conversational flow.

Instead of jumping to your next planned question, you "lock on" to a keyword or phrase the prospect used and ask them to elaborate. This builds trust, uncovers deeper needs, and makes the prospect feel heard.

How to use it:
1. Listen carefully to the prospect''s response
2. Identify a key word or phrase they used
3. Repeat that word/phrase and ask them to expand on it
4. Let the conversation flow naturally from their answer',
    'discovery',
    '[{"scenario": "Prospect says: We''ve been struggling with parent communication around picture day.", "question": "You mentioned ''struggling with parent communication'' — can you walk me through what that looks like on a typical picture day?", "why": "Locks onto their exact pain point and asks them to paint a vivid picture of the problem."},{"scenario": "Prospect says: We tried another photographer but it didn''t work out.", "question": "When you say it ''didn''t work out,'' what specifically fell short of your expectations?", "why": "Locks onto the vague phrase to uncover specific pain points with the competitor."}]',
    ARRAY['discovery', 'active-listening', 'paul-cherry', 'rapport'],
    1,
    true
  ),

  -- Strategy 2: Impact Questions
  (
    'Impact Questions',
    'questioning',
    'Help prospects quantify the cost of their current problem to create urgency.',
    'Impact Questions help the prospect understand the real cost of NOT solving their problem. Most prospects know they have a pain point, but they haven''t quantified what it''s costing them in time, money, reputation, or stress.

By asking impact questions, you help them connect their problem to tangible consequences. This creates urgency and moves them from "Sure" (open but uncommitted) to "Want To" (actively seeking a solution).

The key formula is: "What happens when [their problem] continues?"

Types of impact:
- Financial: "How much revenue are you leaving on the table?"
- Time: "How many hours does your staff spend on this each event?"
- Reputation: "How does this affect how parents perceive your studio?"
- Emotional: "How does this impact your team''s morale during events?"',
    'discovery',
    '[{"scenario": "Prospect mentions disorganized picture days.", "question": "When picture day runs behind schedule, how does that ripple out to the rest of your event day?", "why": "Helps them see the cascading impact of disorganization beyond just the photo session."},{"scenario": "Prospect mentions low photo sales.", "question": "If you could capture even 20% more sales per event, what would that mean for your annual revenue?", "why": "Puts a concrete number on the opportunity cost to create urgency."}]',
    ARRAY['discovery', 'urgency', 'paul-cherry', 'value-selling'],
    2,
    true
  ),

  -- Strategy 3: Expansion Questions
  (
    'Expansion Questions',
    'questioning',
    'Broaden the conversation to uncover needs the prospect hasn''t considered yet.',
    'Expansion Questions take a narrow topic and open it up to explore adjacent needs, stakeholders, or opportunities the prospect may not have considered. This technique helps you:

1. Discover additional pain points beyond the obvious one
2. Identify other decision-makers or influencers
3. Uncover future needs that create long-term partnership opportunities
4. Position yourself as a strategic partner, not just a vendor

The key is to move from the specific issue they raised to the broader context around it. Think of it as zooming out from the detail to see the full picture.

Formula: "Beyond [specific topic], how does this affect [broader area]?"',
    'discovery',
    '[{"scenario": "Prospect is focused on picture day logistics.", "question": "Beyond picture day itself, are there other events throughout the year where professional photography could add value — recitals, competitions, graduations?", "why": "Expands from a single event to year-round opportunity, increasing deal size."},{"scenario": "Prospect mentions they handle ordering themselves.", "question": "When you think about the full process — from scheduling through delivery — which parts take the most of your team''s time?", "why": "Expands the conversation to uncover pain points across the entire workflow."}]',
    ARRAY['discovery', 'upselling', 'paul-cherry', 'strategic'],
    3,
    true
  ),

  -- Strategy 4: Comparison Questions
  (
    'Comparison Questions',
    'questioning',
    'Use comparisons to help prospects evaluate their situation and your solution objectively.',
    'Comparison Questions help prospects evaluate where they are versus where they could be. By asking them to compare their current state to an ideal state (or to what others are doing), you create a gap that your solution can fill.

This technique is especially powerful when prospects think their current situation is "fine" or "good enough." By getting them to articulate the difference between current and ideal, they often talk themselves into wanting change.

Three types of comparison questions:
1. Current vs. Ideal: "How does your current process compare to what you''d ideally want?"
2. Before vs. After: "How did things change after you started doing X?"
3. You vs. Others: "What have you seen other studios in the area doing for their picture days?"

Important: Never make the comparison feel like a judgment. Frame it as curiosity.',
    'discovery',
    '[{"scenario": "Prospect seems satisfied with current photographer.", "question": "If you could design the perfect picture day experience from scratch, what would it look like compared to how things run now?", "why": "Gets them to articulate gaps without directly criticizing their current setup."},{"scenario": "Prospect is comparing your pricing to a competitor.", "question": "When you compare the full experience — setup, session flow, ordering, delivery — how do the two options stack up beyond just the price?", "why": "Shifts the comparison from price-only to total value, where you can differentiate."}]',
    ARRAY['discovery', 'competitive', 'paul-cherry', 'value-selling'],
    4,
    true
  ),

  -- Strategy 5: Vision Questions
  (
    'Vision Questions',
    'questioning',
    'Help prospects envision a better future state to drive commitment.',
    'Vision Questions help the prospect paint a picture of their ideal future state — with your solution in place. This moves them from "Want To" to "Have To" by making the desired outcome feel tangible and achievable.

When a prospect can clearly see and describe their better future, they become emotionally invested in making it happen. Vision questions tap into aspiration and forward momentum.

The key formula: "Imagine if [desired outcome] — what would that mean for [their priority]?"

When to use vision questions:
- After you''ve established pain points (impact questions)
- When the prospect is on the fence
- When you need to re-engage a stalled conversation
- During the closing phase to reinforce the decision

Vision questions work best when they''re specific to what the prospect has already told you they care about.',
    'closing',
    '[{"scenario": "Prospect has described chaotic picture days.", "question": "Imagine if picture day ran so smoothly that parents were actually excited about it and your team could focus on the event instead of logistics — what would that free up for you?", "why": "Paints a vivid picture of the solution while connecting to their specific pain points."},{"scenario": "Prospect is concerned about parent satisfaction.", "question": "If every parent received a beautifully curated gallery within 48 hours of the event, how do you think that would change their perception of your studio?", "why": "Helps them envision a specific, desirable outcome tied to their stated concern."}]',
    ARRAY['closing', 'commitment', 'paul-cherry', 'vision', 'aspiration'],
    5,
    true
  ),

  -- Strategy 6: The Sure → Want To → Have To Framework
  (
    'Sure → Want To → Have To Framework',
    'framework',
    'Paul Cherry''s commitment progression model — guide prospects through three stages of buying readiness.',
    'The "Sure → Want To → Have To" framework is the backbone of Paul Cherry''s sales methodology. Every prospect moves through three stages of commitment:

**SURE Stage** — "I''m open to hearing more"
- The prospect is polite and willing to talk, but not invested
- They''re giving you "sure" answers without real engagement
- Your goal: Ask discovery questions to uncover real pain points
- Danger: Staying here too long means you''re just a friendly chat

**WANT TO Stage** — "I can see how this would help"
- The prospect has connected their pain to your solution
- They''re asking questions, showing genuine interest
- Your goal: Use impact questions to quantify the cost of inaction
- Danger: They may "want to" forever without committing

**HAVE TO Stage** — "I need to make this happen"
- The prospect feels urgency — the cost of waiting outweighs the effort of changing
- They''re asking about next steps, pricing, timelines
- Your goal: Make it easy to say yes — remove friction, provide clear next steps
- Danger: Don''t oversell once they''re here — just close

How to move prospects through the stages:
- Sure → Want To: Lock-On + Impact Questions (uncover and quantify pain)
- Want To → Have To: Expansion + Vision Questions (broaden impact, paint the future)
- Have To → Close: Clear proposal, easy onboarding, reduce risk',
    'framework',
    '[{"scenario": "Prospect is in the SURE stage — polite but not engaged.", "question": "What prompted you to take this meeting today? What''s changed recently?", "why": "Uncovers the trigger event that made them open to talking — moves from polite to purposeful."},{"scenario": "Prospect is in the WANT TO stage — interested but not committing.", "question": "What would need to be true for you to feel confident moving forward with this before your next event?", "why": "Identifies the specific conditions needed for commitment and creates a timeline."}]',
    ARRAY['framework', 'paul-cherry', 'commitment', 'sales-process', 'methodology'],
    0,
    true
  )

ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. Feature Flags — Default flags (all disabled)
-- ============================================================================
-- These are seeded in the migration (20260213000014) via ON CONFLICT DO NOTHING,
-- but we include them here as well for completeness when using `db reset`.

INSERT INTO feature_flags (key, description, is_enabled) VALUES
  ('voice_practice',     'Enable voice-based practice mode with speech-to-text',              false),
  ('timed_mode',         'Enable timed practice sessions with countdown timer',               false),
  ('confidence_meter',   'Show real-time confidence meter during practice sessions',           false),
  ('expert_comparison',  'Allow users to compare their responses with expert examples',        false),
  ('custom_scenarios',   'Allow users to create custom practice scenarios',                    false),
  ('maintenance_mode',   'Put the entire app into maintenance mode (shows maintenance page)',   false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 4. AI Provider Config — Default provider settings
-- ============================================================================
-- These are seeded in the migration (20260213000005) via ON CONFLICT DO NOTHING,
-- but we include them here as well for completeness when using `db reset`.

INSERT INTO ai_provider_config (feature, provider, model, max_tokens, temperature) VALUES
  ('live-call',   'gemini', 'gemini-2.0-flash', 1024,  0.30),
  ('practice',    'gemini', 'gemini-2.0-flash', 2048,  0.70),
  ('email',       'gemini', 'gemini-2.5-pro',   4096,  0.50),
  ('analyzer',    'gemini', 'gemini-2.5-pro',   4096,  0.30),
  ('strategies',  'gemini', 'gemini-2.5-pro',   2048,  0.50)
ON CONFLICT (feature) DO NOTHING;
