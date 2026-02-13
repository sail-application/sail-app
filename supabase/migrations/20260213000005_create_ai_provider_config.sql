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
