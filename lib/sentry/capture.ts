/**
 * lib/sentry/capture.ts — Error and message capture wrappers for SAIL.
 *
 * Wraps Sentry.captureException / captureMessage with SAIL-specific tags
 * (feature, provider, model, route, userId) so errors are easily filterable
 * in the Sentry dashboard.
 *
 * Preserves console.error behavior for local dev visibility — Sentry capture
 * is additive, not a replacement.
 */

import * as Sentry from "@sentry/nextjs";

/** Context tags attached to every Sentry capture from SAIL */
interface CaptureContext {
  /** Which SAIL feature triggered this (e.g., 'live-call', 'practice') */
  feature?: string;
  /** AI provider name (e.g., 'gemini', 'openai') */
  provider?: string;
  /** AI model name (e.g., 'gemini-2.0-flash') */
  model?: string;
  /** API route path (e.g., '/api/ai/chat') */
  route?: string;
  /** Authenticated user's ID */
  userId?: string;
  /** Any additional key-value pairs for debugging */
  extra?: Record<string, unknown>;
}

/**
 * Captures an error to Sentry with SAIL-specific context tags.
 * Also logs to console.error for local dev visibility.
 */
export function captureError(error: unknown, context?: CaptureContext): void {
  // Always log locally so dev can see errors in the terminal
  console.error(error);

  Sentry.withScope((scope) => {
    if (context?.feature) scope.setTag("feature", context.feature);
    if (context?.provider) scope.setTag("ai.provider", context.provider);
    if (context?.model) scope.setTag("ai.model", context.model);
    if (context?.route) scope.setTag("route", context.route);
    if (context?.userId) scope.setUser({ id: context.userId });
    if (context?.extra) scope.setExtras(context.extra);

    Sentry.captureException(error);
  });
}

/**
 * Captures a non-exception message to Sentry (rate limits, auth failures, etc.).
 * Useful for events that aren't errors but need visibility.
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "warning",
  context?: CaptureContext,
): void {
  Sentry.withScope((scope) => {
    if (context?.feature) scope.setTag("feature", context.feature);
    if (context?.provider) scope.setTag("ai.provider", context.provider);
    if (context?.route) scope.setTag("route", context.route);
    if (context?.userId) scope.setUser({ id: context.userId });
    if (context?.extra) scope.setExtras(context.extra);

    Sentry.captureMessage(message, level);
  });
}
