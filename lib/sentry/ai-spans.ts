/**
 * lib/sentry/ai-spans.ts — AI call tracing and metrics for SAIL.
 *
 * Wraps AI calls in Sentry spans for latency visibility and records
 * custom metrics (call count, latency distribution, token usage) that
 * power the AI Insights dashboard in Sentry.
 *
 * Note: The native Sentry AI integrations (googleGenAIIntegration, etc.)
 * auto-instrument the underlying SDK calls. This module adds SAIL-level
 * context: which feature made the call, custom business metrics, etc.
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Wraps an AI call in a Sentry span and records custom metrics.
 * Records: ai.call.latency_ms (distribution), ai.tokens.used (counter), ai.calls (counter).
 *
 * @param feature - SAIL feature making the call (e.g., 'live-call', 'practice')
 * @param provider - AI provider (e.g., 'gemini', 'openai')
 * @param model - Model name (e.g., 'gemini-2.0-flash')
 * @param fn - The async function that makes the actual AI call
 * @returns The result of fn()
 */
export async function withAiSpan<T>(
  feature: string,
  provider: string,
  model: string,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `ai.chat.${feature}`,
      op: "ai.chat",
      attributes: {
        "ai.feature": feature,
        "ai.provider": provider,
        "ai.model": model,
      },
    },
    async () => {
      const start = Date.now();
      const result = await fn();
      const latencyMs = Date.now() - start;

      // Record custom metrics for AI cost/performance dashboards
      Sentry.metrics.distribution("ai.call.latency_ms", latencyMs, {
        attributes: { feature, provider, model },
        unit: "millisecond",
      });
      Sentry.metrics.count("ai.calls", 1, {
        attributes: { feature, provider, model },
      });

      return result;
    },
  );
}

/**
 * Records AI token usage as a Sentry counter metric.
 * Called after an AI response is received with token counts.
 */
export function trackAiTokens(
  feature: string,
  provider: string,
  model: string,
  totalTokens: number,
): void {
  Sentry.metrics.count("ai.tokens.used", totalTokens, {
    attributes: { feature, provider, model },
  });
}

/**
 * Adds a breadcrumb to the Sentry timeline for AI call debugging.
 * Breadcrumbs appear in the error detail view to show what happened before a crash.
 */
export function addAiBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    category: "ai",
    message,
    data,
    level: "info",
  });
}
