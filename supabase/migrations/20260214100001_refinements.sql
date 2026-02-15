-- ============================================================================
-- Migration: 20260214100001_refinements
-- Purpose: Post-merge refinements for the Methodologies Library:
--   1a. Grant admin role to alex@sapicture.day so /admin/strategies is accessible
--   1b. Deactivate all methodologies except Paul Cherry (Questions That Sell)
--   1c. Replace Paul Cherry video with the correct YouTube link
--   1d. Add cover_url to Paul Cherry book entries via Open Library ISBN lookup
-- ============================================================================

-- 1a. Grant admin role to alex@sapicture.day
-- Uses ON CONFLICT to be idempotent (safe to run multiple times)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'alex@sapicture.day'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 1b. Deactivate all methodologies except Paul Cherry
-- Only Paul Cherry should be visible to users for now
UPDATE public.methodologies
SET is_active = false
WHERE slug != 'questions-that-sell';

-- 1c. Replace Paul Cherry video with the correct YouTube link
UPDATE public.methodologies
SET videos = '[{"title":"Questions That Sell — Paul Cherry","url":"https://www.youtube.com/watch?v=psFgL1sHtoo"}]'::jsonb
WHERE slug = 'questions-that-sell';

-- 1d. Add cover_url to Paul Cherry book entries using Open Library ISBN covers
-- Books are stored as JSONB arrays — we iterate each entry and append cover_url
UPDATE public.methodologies
SET books = (
  SELECT jsonb_agg(
    b || jsonb_build_object(
      'cover_url',
      CASE
        WHEN b->>'isbn' IS NOT NULL AND b->>'isbn' != ''
        THEN 'https://covers.openlibrary.org/b/isbn/' || (b->>'isbn') || '-L.jpg'
        ELSE ''
      END
    )
  )
  FROM jsonb_array_elements(books) AS b
)
WHERE slug = 'questions-that-sell'
  AND books IS NOT NULL
  AND jsonb_array_length(books) > 0;
