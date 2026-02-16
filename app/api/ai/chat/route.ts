/**
 * app/api/ai/chat/route.ts
 *
 * Unified AI chat endpoint. All features (Live Call, Practice Mode, Email,
 * Analyzer, Strategies) POST here with a feature identifier, and the
 * server-side AI provider abstraction routes the request to the configured
 * model (Gemini, Claude, OpenAI, etc.).
 *
 * When no system message is provided in the messages array, the endpoint
 * auto-resolves the user's active methodology and composes a methodology-aware
 * system prompt using the prompt composer.
 *
 * Auth: Required (Supabase session via cookies)
 * Rate limit: 30 requests / 60 seconds per user
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - GOOGLE_GENERATIVE_AI_API_KEY (or whichever provider is configured)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import { aiChat } from "@/lib/ai/provider";
import { resolveMethodology } from "@/lib/ai/methodology-resolver";
import { composeSystemPrompt } from "@/lib/ai/prompt-composer";
import { captureError, trackRateLimitHit } from "@/lib/sentry";

/** Rate limiter scoped to this route: 30 requests per 60-second window */
const limiter = rateLimit({ limit: 30, windowMs: 60_000 });

/** Zod schema validating the incoming request body */
const chatRequestSchema = z.object({
  /** Array of conversation messages (must have at least one) */
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
  /** Which SAIL feature is making this request (determines AI provider/model) */
  feature: z.enum(["live-call", "practice", "email", "analyzer", "strategies"]),
  /** Optional methodology override (uses user's primary if not provided) */
  methodologyId: z.string().uuid().optional(),
});

/**
 * POST /api/ai/chat
 * Accepts a chat conversation and feature identifier, routes to the
 * appropriate AI provider, and returns the model's response.
 */
export async function POST(request: NextRequest) {
  try {
    /* ── 1. Authenticate the user ── */
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    /* ── 2. Rate limit by user ID ── */
    const rateLimitResult = limiter(user.id);
    if (!rateLimitResult.success) {
      trackRateLimitHit("/api/ai/chat");
      return NextResponse.json(
        {
          error: "Too many requests. Please wait before trying again.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    /* ── 3. Parse and validate the request body ── */
    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    /* ── 4. Resolve methodology and inject system prompt if needed ── */
    const { messages, feature, methodologyId } = parsed.data;
    const hasSystemMessage = messages.some((m) => m.role === "system");

    let finalMessages = [...messages];

    if (!hasSystemMessage) {
      const methodology = await resolveMethodology(user.id, methodologyId);
      const systemMessages = composeSystemPrompt(feature, methodology);
      finalMessages = [...systemMessages, ...messages];
    }

    /* ── 5. Call the AI provider through the abstraction layer ── */
    const response = await aiChat(
      { messages: finalMessages, feature, methodologyId },
      user.id,
    );

    /* ── 6. Return the AI response ── */
    return NextResponse.json({
      content: response.content,
      tokensUsed: response.tokensUsed,
      provider: response.provider,
      model: response.model,
      latencyMs: response.latencyMs,
    });
  } catch (error) {
    captureError(error, { route: "/api/ai/chat" });
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 },
    );
  }
}
