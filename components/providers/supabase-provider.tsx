/**
 * components/providers/supabase-provider.tsx
 *
 * Client-side React Context provider for Supabase.
 *
 * Creates a single browser Supabase client (via @/lib/supabase/client) and
 * exposes it along with the current authenticated user through React Context.
 * The auth state is kept in sync by subscribing to Supabase's
 * onAuthStateChange listener — when the user signs in, signs out, or their
 * token refreshes, the context updates automatically.
 *
 * Usage: Wrap your app with <SupabaseProvider> and consume with useSupabase().
 */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/* ── Context Type ── */

/** Shape of the Supabase context value consumed by child components */
type SupabaseContextValue = {
  /** The browser Supabase client instance */
  supabase: SupabaseClient;
  /** The currently authenticated user, or null if not signed in */
  user: User | null;
  /** True while the initial auth state is being resolved */
  isLoading: boolean;
};

/* ── Context ── */

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

/* ── Provider Component ── */

/**
 * Provides a shared Supabase client and auth state to all child components.
 * The client is created once (via useState initializer) and never recreated.
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Create the Supabase client once — useState initializer avoids re-creation
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Subscribe to auth state changes. This fires immediately with the
     * current session (INITIAL_SESSION event) and again on every sign-in,
     * sign-out, or token refresh.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Clean up the subscription when the provider unmounts
    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

/* ── Consumer Hook ── */

/**
 * Returns the Supabase client, user, and loading state from context.
 * Must be called inside a <SupabaseProvider> — throws if used outside.
 */
export function useSupabase(): SupabaseContextValue {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error(
      'useSupabase must be used within a <SupabaseProvider>. ' +
        'Wrap your component tree with <SupabaseProvider> in the root layout.',
    );
  }

  return context;
}
