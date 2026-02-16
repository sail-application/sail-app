/**
 * lib/sentry/set-user.ts — Sentry user context management for SAIL.
 *
 * Sets or clears the Sentry user context when auth state changes.
 * Called from the SupabaseProvider's onAuthStateChange listener so that
 * all subsequent errors are associated with the correct user.
 */

import * as Sentry from "@sentry/nextjs";

/** Minimal user info to set on Sentry context */
interface SentryUserInfo {
  id: string;
  email?: string;
}

/**
 * Sets the Sentry user context. Call on sign-in / auth state change.
 * Pass null to clear (on sign-out).
 */
export function setSentryUser(user: SentryUserInfo | null): void {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}
