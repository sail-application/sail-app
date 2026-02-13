/**
 * lib/ai/usage-tracker.ts
 *
 * Token usage tracking — logs every AI call to the `token_usage_logs` table
 * for cost analysis and the admin cost dashboard.
 *
 * Uses the service-role admin client to bypass RLS (usage logs are written
 * server-side regardless of which user triggered the call).
 *
 * IMPORTANT: This is a fire-and-forget pattern. The trackUsage() function
 * does NOT return a promise that callers should await. Logging failures
 * are caught silently so they never break the AI response flow.
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import type { AiCompletionResponse, AiFeature } from '@/types/ai';

/**
 * Logs token usage for a completed AI call. Fire-and-forget — this function
 * kicks off an async insert but does not block the caller.
 *
 * @param response - The AI completion response containing token counts and latency.
 * @param feature  - Which SAIL feature made this AI call.
 * @param userId   - The authenticated user's ID.
 */
export function trackUsage(
  response: AiCompletionResponse,
  feature: AiFeature,
  userId: string,
): void {
  // Fire-and-forget: kick off the async insert without awaiting it.
  // We use an IIFE to handle the async/await inside a sync function.
  void (async () => {
    try {
      // Dynamic import keeps this module lightweight and avoids
      // circular dependency issues at module load time.
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();

      const { error } = await supabase.from('token_usage_logs').insert({
        user_id: userId,
        feature,
        provider: response.provider,
        model: response.model,
        prompt_tokens: response.tokensUsed.prompt,
        completion_tokens: response.tokensUsed.completion,
        total_tokens: response.tokensUsed.total,
        latency_ms: response.latencyMs,
      });

      if (error) {
        // Log but don't throw — usage tracking failure must not break AI flow
        console.error('[UsageTracker] Failed to insert usage log:', error.message);
      }
    } catch (err) {
      // Catch everything — network errors, missing env vars, etc.
      // Usage tracking is non-critical; the AI response is already sent.
      console.error('[UsageTracker] Unexpected error:', err);
    }
  })();
}
