/**
 * app/(auth)/unauthorized/page.tsx — Access restricted page.
 *
 * Server Component shown when a user authenticates via Google but
 * their email is NOT found in the authorized_members table. This
 * means they're not a member of the SA Picture Day Skool community.
 *
 * Displays:
 *   - "Access Restricted" heading
 *   - Explanation that Skool membership is required
 *   - Link to join the Skool community
 *   - Sign-out button to clear the session
 */

import type { Metadata } from 'next';
import Link from 'next/link';

/** Page metadata — shows "Access Restricted | SAIL" in the browser tab */
export const metadata: Metadata = {
  title: 'Access Restricted',
};

/**
 * UnauthorizedPage — Informs the user they need Skool membership.
 * Centered glass panel with explanation and action links.
 */
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass w-full max-w-md p-8 text-center">
        {/* Warning icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning text-2xl">
          !
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Access Restricted
        </h1>

        {/* Explanation */}
        <p className="text-foreground/60 mb-6 leading-relaxed">
          SAIL is exclusively available to members of the SAIL community.
          To get access, join our community and then sign in again once
          you are approved.
        </p>

        {/* Action links */}
        <div className="flex flex-col gap-3">
          {/* Link to join the Skool community (placeholder URL) */}
          <a
            href="https://www.skool.com/volume-photography-1922/about"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white font-medium h-10 px-4 hover:bg-brand-700 transition-colors"
          >
            Join SAIL Community
          </a>

          {/* Sign out link — clears session and returns to login */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)] text-foreground/60 font-medium h-10 px-4 hover:bg-white/10 transition-colors"
          >
            Sign out
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-6 text-xs text-foreground/40">
          Already a member? Make sure you&apos;re signing in with the same
          email address associated with your Skool account.
        </p>
      </div>
    </main>
  );
}
