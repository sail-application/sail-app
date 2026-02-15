/**
 * lib/ai/anthropic.ts
 *
 * Anthropic / Claude provider implementation for the SAIL AI abstraction layer.
 * Implements AiProviderInterface using the `@anthropic-ai/sdk` package.
 *
 * Maps SAIL's message roles to Claude's expected format:
 *   - "system"    → separate `system` parameter (not in messages array)
 *   - "user"      → role: "user"
 *   - "assistant" → role: "assistant"
 *
 * Required env vars:
 *   - ANTHROPIC_API_KEY
 */

import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiMessage,
  AiProviderInterface,
} from '@/types/ai';

/** Separates system messages from conversation messages for Claude's API */
function buildClaudeMessages(messages: AiMessage[]) {
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content);
  const system = systemParts.length > 0 ? systemParts.join('\n\n') : undefined;

  const conversationMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  return { system, messages: conversationMessages };
}

/** Lazily initializes the Anthropic client. Throws if API key is missing. */
function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing ANTHROPIC_API_KEY env var. Add it to .env.local to use the Claude provider.',
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk').default;
  return new Anthropic({ apiKey });
}

/**
 * Claude provider — implements the AiProviderInterface contract.
 * Supports Claude Sonnet 4.5, Claude Opus 4.6, and other Anthropic models.
 */
export class AnthropicProvider implements AiProviderInterface {
  async chat(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startMs = Date.now();
    const client = getClient();
    const { system, messages } = buildClaudeMessages(request.messages);

    const model = request.feature === 'live-call'
      ? 'claude-haiku-4-5-20251001'
      : 'claude-sonnet-4-5-20250929';

    const response = await client.messages.create({
      model,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      system,
      messages,
    });

    const text = response.content
      ?.filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('') ?? '';

    const latencyMs = Date.now() - startMs;

    return {
      content: text,
      provider: 'claude',
      model,
      latencyMs,
      tokensUsed: {
        prompt: response.usage?.input_tokens ?? 0,
        completion: response.usage?.output_tokens ?? 0,
        total: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
      },
    };
  }

  async *chatStream(request: AiCompletionRequest): AsyncGenerator<string> {
    const client = getClient();
    const { system, messages } = buildClaudeMessages(request.messages);

    const model = request.feature === 'live-call'
      ? 'claude-haiku-4-5-20251001'
      : 'claude-sonnet-4-5-20250929';

    const stream = client.messages.stream({
      model,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      system,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
