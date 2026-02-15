/**
 * lib/ai/openai.ts
 *
 * OpenAI / ChatGPT provider implementation for the SAIL AI abstraction layer.
 * Implements AiProviderInterface using the `openai` npm package.
 *
 * Maps SAIL's message roles to OpenAI's expected format:
 *   - "system"    → role: "system"
 *   - "user"      → role: "user"
 *   - "assistant" → role: "assistant"
 *
 * Required env vars:
 *   - OPENAI_API_KEY
 */

import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiMessage,
  AiProviderInterface,
} from '@/types/ai';

/** Maps SAIL message roles to OpenAI chat completion message params */
function buildOpenAiMessages(messages: AiMessage[]) {
  return messages.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: m.content,
  }));
}

/** Lazily initializes the OpenAI client. Throws if API key is missing. */
function getClient() {
  // Dynamic import to avoid bundling openai SDK when not used
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY env var. Add it to .env.local to use the OpenAI provider.',
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OpenAI = require('openai').default;
  return new OpenAI({ apiKey });
}

/**
 * OpenAI provider — implements the AiProviderInterface contract.
 * Supports GPT-4o, GPT-4o-mini, and other OpenAI chat models.
 */
export class OpenAiProvider implements AiProviderInterface {
  async chat(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startMs = Date.now();
    const client = getClient();
    const messages = buildOpenAiMessages(request.messages);

    const model = request.feature === 'live-call' ? 'gpt-4o-mini' : 'gpt-4o';

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
      provider: 'openai',
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
    const messages = buildOpenAiMessages(request.messages);

    const model = request.feature === 'live-call' ? 'gpt-4o-mini' : 'gpt-4o';

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
