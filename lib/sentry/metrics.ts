/**
 * lib/sentry/metrics.ts — Business intelligence metrics for SAIL.
 *
 * Custom Sentry counters for sales/marketing/product insights:
 * - Feature adoption: track which SAIL features users actually engage with
 * - Auth events: login success/failure rates
 * - Webhook health: Stripe/Skool event processing visibility
 * - Operational: rate limit hits by route
 *
 * All metrics appear in Sentry Metrics Explorer for dashboards and alerting.
 */

import * as Sentry from "@sentry/nextjs";

/* ── Feature Adoption ── */

/** Track a completed practice session */
export function trackPracticeCompleted(): void {
  Sentry.metrics.count("practice.session.completed", 1);
}

/** Track an email draft created */
export function trackEmailDraftCreated(): void {
  Sentry.metrics.count("email.draft.created", 1);
}

/** Track a call analysis completed */
export function trackCallAnalyzed(): void {
  Sentry.metrics.count("call.analyzed", 1);
}

/** Track a strategy search */
export function trackStrategySearched(): void {
  Sentry.metrics.count("strategy.searched", 1);
}

/* ── Auth Events ── */

/** Track a successful login */
export function trackAuthSuccess(): void {
  Sentry.metrics.count("auth.login.success", 1);
}

/** Track a failed login attempt */
export function trackAuthFailure(reason?: string): void {
  Sentry.metrics.count("auth.login.failure", 1, {
    attributes: { reason: reason ?? "unknown" },
  });
}

/* ── Webhook Events ── */

/** Track a webhook received (by source and event type) */
export function trackWebhookReceived(source: string, eventType: string): void {
  Sentry.metrics.count("webhook.received", 1, {
    attributes: { source, event_type: eventType },
  });
}

/* ── Operational ── */

/** Track a rate limit hit (by route) */
export function trackRateLimitHit(route: string): void {
  Sentry.metrics.count("rate_limit.hit", 1, {
    attributes: { route },
  });
}
