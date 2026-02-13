/**
 * app/(auth)/login/login-form.tsx — Google OAuth login form.
 *
 * Client Component that handles the Google OAuth sign-in flow.
 * On button click, it calls Supabase's signInWithOAuth which redirects
 * the browser to Google's consent screen. After Google authenticates
 * the user, they're sent back to /callback where we exchange the code
 * for a session.
 *
 * Displays a loading state while the redirect is in progress and
 * shows error messages if the OAuth call fails.
 */

'use client';

import { useState } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Button } from '@/components/ui/button';

/**
 * LoginForm — Renders the "Sign in with Google" button.
 * Manages loading and error state for the OAuth redirect flow.
 */
export function LoginForm() {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiates the Google OAuth flow via Supabase.
   * On success, the browser redirects to Google. On failure,
   * we display the error message to the user.
   */
  async function handleGoogleSignIn() {
    try {
      setIsLoading(true);
      setError(null);

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
      }
      // If no error, the browser is redirecting — keep loading state
    } catch (err) {
      // Unexpected error (network failure, etc.)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Error message display */}
      {error && (
        <div className="rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Google OAuth button */}
      <Button
        onClick={handleGoogleSignIn}
        isLoading={isLoading}
        variant="default"
        size="lg"
        className="w-full"
      >
        {/* Google icon (simple SVG) */}
        {!isLoading && (
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Sign in with Google
      </Button>
    </div>
  );
}
