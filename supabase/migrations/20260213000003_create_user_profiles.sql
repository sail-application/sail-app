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
