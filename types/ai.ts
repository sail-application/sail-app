/**
 * types/ai.ts
 *
 * AI provider abstraction types used throughout the SAIL platform.
 * Every AI call — whether Gemini, Claude, OpenAI, or DeepSeek — flows
 * through these shared interfaces so providers can be swapped per-feature
 * from the admin panel without touching feature code.
 */

/* ── Provider & Feature Identifiers ── */

/** Supported AI provider backends */
export type AiProvider = 'gemini' | 'claude' | 'openai' | 'deepseek';

/** Features that consume AI completions — each can be independently configured */
export type AiFeature =
  | 'live-call'
  | 'practice'
  | 'email'
  | 'analyzer'
  | 'strategies';

/* ── Message & Request/Response Shapes ── */

/** Single message in a chat-style AI conversation */
export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Payload sent to any AI provider's chat endpoint.
 * `feature` is used to look up the correct provider config at runtime.
 */
export interface AiCompletionRequest {
  messages: AiMessage[];
  feature: AiFeature;
  maxTokens?: number;
  temperature?: number;
  /** When true, the provider should return a streaming response */
  stream?: boolean;
  /** Active methodology ID — used by prompt composer to inject methodology context */
  methodologyId?: string;
}

/**
 * Normalised response returned from every AI provider.
 * Includes token accounting so we can log costs in `token_usage_logs`.
 */
export interface AiCompletionResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  provider: AiProvider;
  model: string;
  /** Wall-clock time from request start to final token received */
  latencyMs: number;
}

/* ── Provider Interface ── */

/**
 * Contract every AI provider adapter must implement.
 *
 * `chat`       — returns a complete response after the model finishes.
 * `chatStream` — yields content chunks as they arrive (for real-time UIs).
 */
export interface AiProviderInterface {
  /** Send a chat request and wait for the full response */
  chat(request: AiCompletionRequest): Promise<AiCompletionResponse>;

  /** Send a chat request and stream content chunks as they arrive */
  chatStream(request: AiCompletionRequest): AsyncGenerator<string>;
}
