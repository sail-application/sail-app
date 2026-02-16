/**
 * instrumentation-client.ts — Client-side Sentry initialization for SAIL.
 *
 * Next.js automatically loads this file in the browser. Configures:
 * - Browser tracing (Core Web Vitals, navigation spans)
 * - Session Replay (masked text/inputs for PII protection)
 * - beforeBreadcrumb filter to exclude analytics noise (PostHog, GA)
 *
 * Free tier budget strategy:
 * - replaysOnErrorSampleRate: 1.0 → capture 100% of error sessions (highest value)
 * - replaysSessionSampleRate: 0.1 prod / 0.0 dev → conserve quota (~50/month)
 */

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://4637a4b439bee18482a2c260a21b27f1@o4510875821539328.ingest.us.sentry.io/4510892043206656",
  environment: isProd ? "production" : "development",

  /* ── Performance ── */
  tracesSampleRate: isProd ? 0.2 : 1.0,

  /* ── PII Protection ── */
  sendDefaultPii: false,

  /* ── Integrations ── */
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Protect prospect names, call transcripts, and methodology content
      maskAllText: true,
      maskAllInputs: true,
    }),
  ],

  /* ── Session Replay ── */
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  replaysSessionSampleRate: isProd ? 0.1 : 0.0, // Conserve quota in prod, off in dev

  /* ── Filter noisy breadcrumbs from analytics tools ── */
  beforeBreadcrumb(breadcrumb) {
    // Skip PostHog and GA network requests — they add noise to error timelines
    if (breadcrumb.category === "xhr" || breadcrumb.category === "fetch") {
      const url = breadcrumb.data?.url as string | undefined;
      if (
        url &&
        (url.includes("posthog.com") ||
          url.includes("google-analytics.com") ||
          url.includes("googletagmanager.com"))
      ) {
        return null;
      }
    }
    return breadcrumb;
  },
});

// Export onRouterTransitionStart for Next.js App Router navigation tracking
export { captureRouterTransitionStart as onRouterTransitionStart } from "@sentry/nextjs";
