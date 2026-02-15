-- ============================================================================
-- Migration: 20260214000003_add_methodology_to_strategies
-- Purpose: Link existing strategies (techniques) to parent methodologies.
--
-- Adds a methodology_id FK to the strategies table so techniques can be
-- grouped under their parent methodology. Also adds is_universal for
-- cross-methodology techniques (e.g., "active listening").
--
-- ON DELETE SET NULL preserves strategies if a methodology is deleted.
-- ============================================================================

-- Add methodology foreign key
ALTER TABLE strategies
  ADD COLUMN IF NOT EXISTS methodology_id UUID
    REFERENCES methodologies(id) ON DELETE SET NULL;

-- Flag for techniques that apply to all methodologies
ALTER TABLE strategies
  ADD COLUMN IF NOT EXISTS is_universal BOOLEAN DEFAULT false;

-- Index for querying strategies by methodology
CREATE INDEX IF NOT EXISTS idx_strategies_methodology
  ON strategies (methodology_id) WHERE methodology_id IS NOT NULL;

-- Index for filtering by category (was missing per DevOps review)
CREATE INDEX IF NOT EXISTS idx_strategies_category
  ON strategies (category) WHERE is_active = true;

COMMENT ON COLUMN strategies.methodology_id IS 'Parent methodology this technique belongs to (NULL = unlinked)';
COMMENT ON COLUMN strategies.is_universal IS 'True if this technique applies across all methodologies';
