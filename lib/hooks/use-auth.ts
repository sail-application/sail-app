/**
 * lib/hooks/use-auth.ts
 *
 * Client-side hook for accessing auth state enriched with RBAC role info.
 *
 * Builds on the useSupabase() context to additionally fetch the user's
 * role from the `user_roles` table. This avoids every component that
 * needs role info from having to make its own Supabase query.
 *
 * Returns:
 *   - user: the Supabase User object (or null)
 *   - role: the user's RBAC role ('admin' | 'team_lead' | 'rep' | null)
 *   - isLoading: true while auth state or role is still being fetched
 *   - isAdmin: convenience boolean — true when role === 'admin'
 *   - isTeamLead: convenience boolean — true when role === 'team_lead'
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
import type { UserRoleType } from '@/types/auth';

/** Return type of the useAuth hook */
interface UseAuthReturn {
  /** The authenticated Supabase user, or null if not signed in */
  user: ReturnType<typeof useSupabase>['user'];
  /** The user's RBAC role from the user_roles table, or null if unknown */
  role: UserRoleType | null;
  /** True while auth state or role data is still loading */
  isLoading: boolean;
  /** Convenience flag: true when the user has the 'admin' role */
  isAdmin: boolean;
  /** Convenience flag: true when the user has the 'team_lead' role */
  isTeamLead: boolean;
}

/**
 * Hook that combines Supabase auth state with the user's RBAC role.
 *
 * On mount (and whenever the user changes), it queries the `user_roles`
 * table to resolve the role. The role query only runs when there is an
 * authenticated user, so unauthenticated visitors never trigger a DB call.
 */
export function useAuth(): UseAuthReturn {
  const { supabase, user, isLoading: isAuthLoading } = useSupabase();
  const [role, setRole] = useState<UserRoleType | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  /**
   * Fetches the user's role from the user_roles table.
   * Wrapped in useCallback so it can be safely referenced in the
   * useEffect dependency array without causing infinite re-renders.
   */
  const fetchRole = useCallback(async () => {
    if (!user) {
      // No authenticated user — clear role and stop loading
      setRole(null);
      setIsRoleLoading(false);
      return;
    }

    setIsRoleLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Query failed — user might not have a role row yet.
        // Default to null; the UI should handle this gracefully.
        console.warn('[useAuth] Failed to fetch user role:', error.message);
        setRole(null);
      } else {
        setRole(data.role as UserRoleType);
      }
    } catch (err) {
      // Unexpected error (network issue, etc.) — log and clear role
      console.error('[useAuth] Unexpected error fetching role:', err);
      setRole(null);
    } finally {
      setIsRoleLoading(false);
    }
  }, [supabase, user]);

  // Re-fetch the role whenever the user changes (sign-in, sign-out, token refresh)
  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Combined loading state: true while either auth or role is resolving
  const isLoading = isAuthLoading || isRoleLoading;

  return {
    user,
    role,
    isLoading,
    isAdmin: role === 'admin',
    isTeamLead: role === 'team_lead',
  };
}
