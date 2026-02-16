/**
 * app/api/ai/analyze/route.ts
 *
 * Post-call analysis endpoint. Accepts a call transcript (and optional call
 * type / methodology override) and uses the AI provider (feature = 'analyzer')
 * to produce a structured scorecard based on the user's active methodology.
 *
 * Auth: Required (Supabase session via cookies)
 * Rate limit: 10 requests / 60 seconds per user (analysis is expensive)
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
import {
  captureError,
  trackRateLimitHit,
  trackCallAnalyzed,
} from "@/lib/sentry";

/** Rate limiter scoped to this route: 10 requests per 60-second window */
const limiter = rateLimit({ limit: 10, windowMs: 60_000 });

/** Zod schema validating the incoming request body */
const analyzeRequestSchema = z.object({
  /** The full call transcript to analyze */
  transcript: z.string().min(10, "Transcript must be at least 10 characters."),
  /** Optional call type for more targeted analysis (e.g. 'cold-call', 'follow-up') */
  callType: z.string().optional(),
  /** Optional methodology override (uses user's primary if not provided) */
  methodologyId: z.string().uuid().optional(),
});

/**
 * POST /api/ai/analyze
 * Accepts a call transcript and returns a structured analysis scorecard.
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
      trackRateLimitHit("/api/ai/analyze");
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
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    /* ── 4. Resolve the user's active methodology ── */
    const { transcript, callType, methodologyId } = parsed.data;
    const methodology = await resolveMethodology(user.id, methodologyId);

    /* ── 5. Compose methodology-aware system prompt ── */
    const systemMessages = composeSystemPrompt("analyzer", methodology);

    /* ── 6. Build the user message with transcript and optional call type ── */
    const userMessage = callType
      ? `Call type: ${callType}\n\nTranscript:\n${transcript}`
      : `Transcript:\n${transcript}`;

    /* ── 7. Call the AI provider with composed prompt ── */
    const response = await aiChat(
      {
        messages: [...systemMessages, { role: "user", content: userMessage }],
        feature: "analyzer",
        methodologyId: methodology?.id,
      },
      user.id,
    );

    /* ── 8. Track feature adoption and return the analysis result ── */
    trackCallAnalyzed();
    return NextResponse.json({
      analysis: response.content,
      methodology: methodology
        ? { id: methodology.id, name: methodology.name }
        : null,
      tokensUsed: response.tokensUsed,
      provider: response.provider,
      model: response.model,
      latencyMs: response.latencyMs,
    });
  } catch (error) {
    captureError(error, { route: "/api/ai/analyze" });
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 },
    );
  }
}
