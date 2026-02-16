/**
 * lib/ai/provider.ts — THE ONLY ENTRY POINT for AI calls in SAIL.
 *
 * Looks up provider/model config per feature from `ai_provider_configs`,
 * delegates to the correct provider, and tracks token usage (fire-and-forget).
 * Config is cached for 5 minutes to avoid excessive DB queries.
 *
 * Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * GOOGLE_GEMINI_API_KEY (if using Gemini — the default).
 */

import type {
  AiFeature,
  AiProvider,
  AiCompletionRequest,
  AiCompletionResponse,
} from "@/types/ai";
import type { AiProviderInterface } from "@/types/ai";
import { GeminiProvider } from "./gemini";
import { OpenAiProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { DeepSeekProvider } from "./deepseek";
import { trackUsage } from "./usage-tracker";
import {
  withAiSpan,
  addAiBreadcrumb,
  trackAiTokens,
  captureError,
} from "@/lib/sentry";

/* ───────────────── Config Cache ───────────────── */

/** Shape of a cached config entry for one feature. */
interface CachedConfig {
  provider: AiProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  cachedAt: number;
}

/** In-memory cache: feature key → config + timestamp. */
const configCache = new Map<AiFeature, CachedConfig>();

/** How long cached config stays valid (5 minutes in milliseconds). */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Default fallback when no config is found in the database. */
const DEFAULT_CONFIG: Omit<CachedConfig, "cachedAt"> = {
  provider: "gemini",
  model: "gemini-2.0-flash",
  maxTokens: 2048,
  temperature: 0.7,
};

/* ───────────────── Provider Registry ───────────────── */

/**
 * Lazy-initialized provider instances. Each provider is created on first use
 * and reused for all subsequent calls. This avoids instantiating providers
 * whose API keys aren't configured.
 */
const providerInstances = new Map<AiProvider, AiProviderInterface>();

/**
 * Returns the provider implementation for the given provider key.
 * Lazily creates provider instances on first use.
 */
function getProviderInstance(provider: AiProvider): AiProviderInterface {
  const existing = providerInstances.get(provider);
  if (existing) return existing;

  let instance: AiProviderInterface;
  switch (provider) {
    case "gemini":
      instance = new GeminiProvider();
      break;
    case "openai":
      instance = new OpenAiProvider();
      break;
    case "claude":
      instance = new AnthropicProvider();
      break;
    case "deepseek":
      instance = new DeepSeekProvider();
      break;
    default:
      console.warn(
        `[AI] Provider "${provider}" not recognized — falling back to Gemini`,
      );
      instance = new GeminiProvider();
  }

  providerInstances.set(provider, instance);
  return instance;
}

/* ───────────────── Config Loader ───────────────── */

/**
 * Fetches the provider config for a feature from Supabase.
 * Results are cached for 5 minutes. Falls back to DEFAULT_CONFIG
 * if the DB query fails or returns no results.
 */
async function getConfigForFeature(feature: AiFeature): Promise<CachedConfig> {
  // Check cache first
  const cached = configCache.get(feature);
  const now = Date.now();
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    // Dynamic import to avoid circular dependencies and keep this module
    // loadable in edge contexts where top-level DB calls would fail.
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("ai_provider_configs")
      .select("provider, model, max_tokens, temperature")
      .eq("feature", feature)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.warn(
        `[AI] No active config for feature "${feature}" — using defaults`,
      );
      const fallback: CachedConfig = { ...DEFAULT_CONFIG, cachedAt: now };
      configCache.set(feature, fallback);
      return fallback;
    }

    // Store the fetched config in cache
    const config: CachedConfig = {
      provider: data.provider as AiProvider,
      model: data.model,
      maxTokens: data.max_tokens,
      temperature: data.temperature,
      cachedAt: now,
    };
    configCache.set(feature, config);
    return config;
  } catch (err) {
    captureError(err, { feature, route: "lib/ai/provider.ts" });
    const fallback: CachedConfig = { ...DEFAULT_CONFIG, cachedAt: now };
    configCache.set(feature, fallback);
    return fallback;
  }
}

/* ───────────────── Public API ───────────────── */

/**
 * Non-streaming chat request. Resolves the provider for the feature,
 * sends the request, and tracks token usage (fire-and-forget).
 */
export async function aiChat(
  request: AiCompletionRequest,
  userId?: string,
): Promise<AiCompletionResponse> {
  // Resolve which provider/model to use for this feature
  const config = await getConfigForFeature(request.feature);
  const provider = getProviderInstance(config.provider);

  // Build the final request with config defaults + caller overrides
  const finalRequest: AiCompletionRequest = {
    ...request,
    maxTokens: request.maxTokens ?? config.maxTokens,
    temperature: request.temperature ?? config.temperature,
  };

  // Add breadcrumb for debugging timeline
  addAiBreadcrumb(`AI chat: ${request.feature}`, {
    provider: config.provider,
    model: config.model,
  });

  // Execute the chat call wrapped in a Sentry span for latency tracking
  const response = await withAiSpan(
    request.feature,
    config.provider,
    config.model,
    () => provider.chat(finalRequest),
  );

  // Track token usage as a Sentry metric
  trackAiTokens(
    request.feature,
    config.provider,
    config.model,
    response.tokensUsed.total,
  );

  // Fire-and-forget usage tracking (don't block the response)
  if (userId) {
    trackUsage(response, request.feature, userId);
  }

  return response;
}

/**
 * Streaming chat request. Yields text chunks as they arrive.
 * Usage tracking is NOT done here — caller should track manually.
 */
export async function* aiChatStream(
  request: AiCompletionRequest,
): AsyncGenerator<string> {
  // Resolve which provider/model to use for this feature
  const config = await getConfigForFeature(request.feature);
  const provider = getProviderInstance(config.provider);

  // Build the final request with config defaults + caller overrides
  const finalRequest: AiCompletionRequest = {
    ...request,
    stream: true,
    maxTokens: request.maxTokens ?? config.maxTokens,
    temperature: request.temperature ?? config.temperature,
  };

  // Delegate streaming to the provider and yield each chunk
  yield* provider.chatStream(finalRequest);
}

/**
 * Manually clears the config cache. Useful after an admin changes
 * provider settings and wants them to take effect immediately.
 */
export function clearConfigCache(): void {
  configCache.clear();
}
