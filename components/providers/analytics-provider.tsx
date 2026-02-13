/**
 * components/providers/analytics-provider.tsx
 *
 * Client component that initialises analytics services:
 *   - PostHog — product analytics and feature flags (production only)
 *   - Vercel Analytics — web vitals and page-view tracking
 *
 * PostHog is only initialised when:
 *   1. We're in the browser (typeof window !== 'undefined')
 *   2. The NEXT_PUBLIC_POSTHOG_KEY env var is set
 *   3. NODE_ENV is 'production'
 *
 * Vercel Analytics is always rendered but the <Analytics /> component
 * handles its own environment gating internally.
 *
 * Required env vars (production only):
 *   - NEXT_PUBLIC_POSTHOG_KEY — PostHog project API key
 *   - NEXT_PUBLIC_POSTHOG_HOST (optional) — defaults to https://us.i.posthog.com
 */

'use client';

import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/next';
import posthog from 'posthog-js';

/**
 * Initialises PostHog in a useEffect (browser-only, production-only)
 * and renders the Vercel Analytics component alongside children.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    /**
     * Guard: only initialise PostHog in the browser, in production,
     * and when the API key is available. This prevents errors in dev
     * and avoids polluting analytics with development data.
     */
    if (
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NODE_ENV === 'production'
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        /** Enable debug logging in development for troubleshooting */
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') ph.debug();
        },
      });
    }
  }, []);

  return (
    <>
      {children}
      {/* Vercel Analytics handles its own environment detection */}
      <Analytics />
    </>
  );
}
