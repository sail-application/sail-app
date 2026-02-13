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
