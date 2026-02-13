/**
 * lib/ai/gemini.ts
 *
 * Google Gemini provider implementation for the SAIL AI abstraction layer.
 * Implements AiProviderInterface using the @google/generative-ai SDK.
 *
 * Supports both non-streaming chat (chat method) and streaming (chatStream).
 * Maps SAIL's message roles to Gemini's expected format:
 *   - "system" → systemInstruction (separate from contents)
 *   - "user"   → contents with role "user"
 *   - "assistant" → contents with role "model"
 *
 * Tracks latency by recording start time and computing duration.
 *
 * Required env vars:
 *   - GOOGLE_GEMINI_API_KEY
 */

import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from '@google/generative-ai';
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiMessage,
  AiProviderInterface,
} from '@/types/ai';

/**
 * Converts SAIL AiMessage[] into Gemini's Content[] format.
 * System messages are extracted separately (Gemini uses systemInstruction).
 * Consecutive messages from the same role are merged into one Content entry
 * because Gemini expects alternating user/model turns.
 */
function buildGeminiContents(messages: AiMessage[]): {
  systemInstruction: string | undefined;
  contents: Content[];
} {
  // Extract and concatenate all system messages into one instruction
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content);
  const systemInstruction =
    systemParts.length > 0 ? systemParts.join('\n\n') : undefined;

  // Map non-system messages to Gemini Content objects
  const contents: Content[] = [];
  for (const msg of messages) {
    if (msg.role === 'system') continue;

    // Gemini uses "user" and "model" — map "assistant" → "model"
    const geminiRole = msg.role === 'assistant' ? 'model' : 'user';
    const part: Part = { text: msg.content };

    // Merge consecutive same-role messages (Gemini requires alternating turns)
    const last = contents[contents.length - 1];
    if (last && last.role === geminiRole) {
      last.parts.push(part);
    } else {
      contents.push({ role: geminiRole, parts: [part] });
    }
  }

  return { systemInstruction, contents };
}

/**
 * Lazily initializes the Google Generative AI SDK client.
 * Throws immediately if the API key env var is missing.
 */
function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing GOOGLE_GEMINI_API_KEY env var. ' +
        'Add it to .env.local to use the Gemini provider.',
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Google Gemini provider — implements the AiProviderInterface contract.
 * Instantiate once and reuse across requests (the SDK client is stateless).
 */
export class GeminiProvider implements AiProviderInterface {
  /**
   * Sends a non-streaming chat request to Gemini.
   * Returns a complete AiCompletionResponse with content, token counts,
   * and wall-clock latency.
   */
  async chat(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startMs = Date.now();
    const client = getClient();
    const { systemInstruction, contents } = buildGeminiContents(
      request.messages,
    );

    // Get the generative model with the specified config
    const model = client.getGenerativeModel({
      model: request.feature === 'live-call' ? 'gemini-2.0-flash' : 'gemini-2.5-pro-preview-06-05',
      systemInstruction,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
      },
    });

    // Generate the response
    const result = await model.generateContent({ contents });
    const response = result.response;
    const text = response.text();

    // Extract token usage from Gemini's metadata
    const usage = response.usageMetadata;
    const latencyMs = Date.now() - startMs;

    return {
      content: text,
      provider: 'gemini',
      model: model.model,
      latencyMs,
      tokensUsed: {
        prompt: usage?.promptTokenCount ?? 0,
        completion: usage?.candidatesTokenCount ?? 0,
        total: usage?.totalTokenCount ?? 0,
      },
    };
  }

  /**
   * Sends a streaming chat request to Gemini.
   * Yields text chunks as they arrive from the model. This is used for
   * real-time features like Live Call Assistant where low latency matters.
   */
  async *chatStream(request: AiCompletionRequest): AsyncGenerator<string> {
    const client = getClient();
    const { systemInstruction, contents } = buildGeminiContents(
      request.messages,
    );

    // Get the generative model with the specified config
    const model = client.getGenerativeModel({
      model: request.feature === 'live-call' ? 'gemini-2.0-flash' : 'gemini-2.5-pro-preview-06-05',
      systemInstruction,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
      },
    });

    // Start the streaming generation
    const result = await model.generateContentStream({ contents });

    // Yield each text chunk as it arrives
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
}
