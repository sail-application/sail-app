/**
 * sentry.server.config.ts — Server-side Sentry initialization for SAIL.
 *
 * Loaded automatically by the Next.js instrumentation hook (instrumentation.ts)
 * for the Node.js runtime. Configures error tracking, performance monitoring,
 * and native AI provider integrations (Gemini, OpenAI, Anthropic).
 *
 * PII protection: sendDefaultPii=false, AI inputs/outputs not recorded,
 * beforeSend scrubs API keys and JWTs from error messages.
 */

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://4637a4b439bee18482a2c260a21b27f1@o4510875821539328.ingest.us.sentry.io/4510892043206656",
  environment: isProd ? "production" : "development",

  /* ── Performance ── */
  // 20% of transactions in prod to stay within free tier (~6K/month at 1K req/day)
  tracesSampleRate: isProd ? 0.2 : 1.0,

  /* ── PII Protection ── */
  sendDefaultPii: false,

  /* ── AI Monitoring ── */
  // Native SDK integrations auto-instrument AI provider calls.
  // Inputs/outputs disabled — prompts may contain customer data, transcripts, methodology IP.
  integrations: [
    Sentry.googleGenAIIntegration({
      recordInputs: false,
      recordOutputs: false,
    }),
    Sentry.openAIIntegration({ recordInputs: false, recordOutputs: false }),
    Sentry.anthropicAIIntegration({
      recordInputs: false,
      recordOutputs: false,
    }),
  ],

  /* ── Scrub sensitive data from error messages before sending ── */
  beforeSend(event) {
    // Patterns that match API keys, JWTs, and webhook secrets
    const sensitivePatterns = [
      /sk[-_](?:live|test)_[A-Za-z0-9]{20,}/g, // Stripe keys
      /whsec_[A-Za-z0-9]{20,}/g, // Stripe webhook secrets
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWTs
      /AIza[A-Za-z0-9_-]{30,}/g, // Google API keys
      /sk-[A-Za-z0-9]{40,}/g, // OpenAI keys
      /xai-[A-Za-z0-9]{40,}/g, // DeepSeek/xAI keys
    ];

    function scrub(str: string): string {
      let result = str;
      for (const pattern of sensitivePatterns) {
        result = result.replace(pattern, "[REDACTED]");
      }
      return result;
    }

    // Scrub exception messages
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value) ex.value = scrub(ex.value);
      }
    }

    // Scrub breadcrumb messages
    if (event.breadcrumbs) {
      for (const bc of event.breadcrumbs) {
        if (bc.message) bc.message = scrub(bc.message);
      }
    }

    return event;
  },
});
