-- ============================================================================
-- Migration: 20260214100002_create_check_admin_function
-- Purpose: SECURITY DEFINER function to check if a user has the admin role.
--
-- The user_roles table has RLS policies that use auth.uid(), which can fail
-- when queried from Next.js server components/middleware. This function
-- bypasses RLS (like check_membership) to reliably check admin status.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.check_admin(UUID) TO authenticated;
