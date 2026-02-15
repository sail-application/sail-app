-- ============================================================================
-- Migration: 20260214000002_create_methodologies
-- Purpose: Parent table for sales methodologies (SPIN, Sandler, Paul Cherry, etc.)
--
-- Serves two audiences:
--   1. Users — display content (name, description, videos, books)
--   2. AI — coaching instructions (prompt templates, scoring rubrics, stages)
--
-- JSONB is used for AI coaching content because each methodology has a
-- completely different internal structure (SPIN has 4 stages, Sandler has 7).
-- See ADR 0003 for rationale.
-- ============================================================================

CREATE TABLE IF NOT EXISTS methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Display content (user-facing)
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  how_it_works TEXT,
  best_for TEXT,

  -- Rich media references
  videos JSONB DEFAULT '[]',
  books JSONB DEFAULT '[]',

  -- Classification and filtering
  icon TEXT DEFAULT 'book-open',
  category TEXT NOT NULL DEFAULT 'framework',
  relevance_rating INTEGER DEFAULT 3 CHECK (relevance_rating BETWEEN 1 AND 5),
  complexity_level TEXT DEFAULT 'intermediate'
    CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',

  -- AI coaching content (platform-critical)
  system_prompt_template TEXT,
  feature_prompt_overrides JSONB DEFAULT '{}',
  scoring_rubric JSONB DEFAULT '[]',
  stages JSONB DEFAULT '[]',
  question_types JSONB DEFAULT '[]',
  vocabulary JSONB DEFAULT '{}',
  anti_patterns JSONB DEFAULT '[]',
  success_signals JSONB DEFAULT '[]',

  -- Learning science content
  learning_objectives JSONB DEFAULT '[]',
  concept_chunks JSONB DEFAULT '[]',

  -- Provider preferences (NULL = use feature default)
  preferred_provider TEXT,
  preferred_model TEXT,

  -- Monetization and access
  access_tier TEXT DEFAULT 'pro'
    CHECK (access_tier IN ('free', 'pro', 'team')),

  -- Trademark and attribution (legal compliance)
  trademark_attribution TEXT,
  known_as TEXT,

  -- Partnership support
  contributor_id UUID,
  content_source TEXT,

  -- Display ordering and visibility
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Full-text search vector (maintained by trigger below)
  search_vector tsvector,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger function to keep search_vector in sync on insert/update
CREATE OR REPLACE FUNCTION methodologies_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.author, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_methodologies_search_vector
  BEFORE INSERT OR UPDATE ON methodologies
  FOR EACH ROW EXECUTE FUNCTION methodologies_search_vector_update();

-- Enable Row Level Security
ALTER TABLE methodologies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_methodologies_active_sort
  ON methodologies (is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_methodologies_category
  ON methodologies (category) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_methodologies_search
  ON methodologies USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_methodologies_access_tier
  ON methodologies (access_tier) WHERE is_active = true;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- All authenticated users can read active methodologies
DROP POLICY IF EXISTS "Authenticated users can read methodologies" ON methodologies;
CREATE POLICY "Authenticated users can read methodologies"
  ON methodologies FOR SELECT TO authenticated
  USING (true);

-- Admins can insert methodologies
DROP POLICY IF EXISTS "Admins can insert methodologies" ON methodologies;
CREATE POLICY "Admins can insert methodologies"
  ON methodologies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Admins can update methodologies
DROP POLICY IF EXISTS "Admins can update methodologies" ON methodologies;
CREATE POLICY "Admins can update methodologies"
  ON methodologies FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Admins can delete methodologies
DROP POLICY IF EXISTS "Admins can delete methodologies" ON methodologies;
CREATE POLICY "Admins can delete methodologies"
  ON methodologies FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

COMMENT ON TABLE methodologies IS 'Sales methodologies — parent table for the Strategies Library with AI coaching content';
