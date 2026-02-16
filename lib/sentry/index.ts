/**
 * lib/sentry/index.ts — Barrel export for SAIL's Sentry helpers.
 *
 * Import from '@/lib/sentry' instead of individual files.
 */

export { captureError, captureMessage } from "./capture";
export { withAiSpan, trackAiTokens, addAiBreadcrumb } from "./ai-spans";
export {
  trackPracticeCompleted,
  trackEmailDraftCreated,
  trackCallAnalyzed,
  trackStrategySearched,
  trackAuthSuccess,
  trackAuthFailure,
  trackWebhookReceived,
  trackRateLimitHit,
} from "./metrics";
export { setSentryUser } from "./set-user";
