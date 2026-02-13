/**
 * types/auth.ts
 *
 * Authentication and authorisation types for the SAIL platform.
 *
 * Auth flow: Google OAuth → Supabase Auth → check `authorized_members`
 * table (Skool community gating) → look up RBAC role from `user_roles`.
 */

/* ── Role Type ── */

/** The three RBAC roles supported by SAIL */
export type UserRoleType = 'admin' | 'team_lead' | 'rep';

/* ── Hydrated User ── */

/**
 * Unified user object assembled after authentication.
 * Components and server actions consume this instead of raw Supabase
 * session data so auth details stay in one place.
 */
export interface SailUser {
  /** Supabase `auth.users.id` (UUID) */
  id: string;
  /** Primary email from the Google OAuth profile */
  email: string;
  /** Display name from the Google OAuth profile */
  name: string;
  /** Google profile picture URL (may be null for new accounts) */
  avatarUrl: string | null;
  /** RBAC role resolved from the `user_roles` table */
  role: UserRoleType;
  /** Whether the user's email exists in `authorized_members` (Skool gating) */
  isAuthorized: boolean;
}
