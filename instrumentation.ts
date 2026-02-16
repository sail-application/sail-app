/**
 * instrumentation.ts — Next.js instrumentation hook for SAIL.
 *
 * Next.js calls `register()` once at server startup. We use it to
 * initialize Sentry for both Node.js and Edge runtimes.
 *
 * `onRequestError` is exported to auto-capture uncaught request errors
 * (server components, API routes, etc.) into Sentry.
 */

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side: full Sentry init with AI monitoring, performance, scrubbing
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime: minimal Sentry init for middleware
    await import("./sentry.edge.config");
  }
}

// Auto-capture uncaught errors in server components, API routes, and middleware
export const onRequestError = Sentry.captureRequestError;
