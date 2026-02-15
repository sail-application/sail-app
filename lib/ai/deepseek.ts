/**
 * lib/ai/deepseek.ts
 *
 * DeepSeek provider implementation for the SAIL AI abstraction layer.
 * Uses the `openai` SDK since DeepSeek's API is OpenAI-compatible.
 *
 * Maps SAIL's message roles identically to OpenAI format:
 *   - "system"    → role: "system"
 *   - "user"      → role: "user"
 *   - "assistant" → role: "assistant"
 *
 * Required env vars:
 *   - DEEPSEEK_API_KEY
 */

import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiMessage,
  AiProviderInterface,
} from '@/types/ai';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

/** Maps SAIL message roles to OpenAI-compatible format */
function buildMessages(messages: AiMessage[]) {
  return messages.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: m.content,
  }));
}

/** Lazily initializes the DeepSeek client (OpenAI-compatible). */
function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing DEEPSEEK_API_KEY env var. Add it to .env.local to use the DeepSeek provider.',
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OpenAI = require('openai').default;
  return new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });
}

/**
 * DeepSeek provider — implements the AiProviderInterface contract.
 * Uses OpenAI-compatible API with DeepSeek's base URL.
 */
export class DeepSeekProvider implements AiProviderInterface {
  async chat(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startMs = Date.now();
    const client = getClient();
    const messages = buildMessages(request.messages);

    const model = request.feature === 'live-call'
      ? 'deepseek-chat'
      : 'deepseek-chat';

    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
    });

    const choice = response.choices?.[0];
    const text = choice?.message?.content ?? '';
    const usage = response.usage;
    const latencyMs = Date.now() - startMs;

    return {
      content: text,
      provider: 'deepseek',
      model,
      latencyMs,
      tokensUsed: {
        prompt: usage?.prompt_tokens ?? 0,
        completion: usage?.completion_tokens ?? 0,
        total: usage?.total_tokens ?? 0,
      },
    };
  }

  async *chatStream(request: AiCompletionRequest): AsyncGenerator<string> {
    const client = getClient();
    const messages = buildMessages(request.messages);

    const model = 'deepseek-chat';

    const stream = await client.chat.completions.create({
      model,
      messages,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  }
}
