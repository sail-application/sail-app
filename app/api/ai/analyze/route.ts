/**
 * app/api/ai/analyze/route.ts
 *
 * Post-call analysis endpoint. Accepts a call transcript (and optional call
 * type) and uses the AI provider (feature = 'analyzer') to produce a
 * structured scorecard based on Paul Cherry's "Questions That Sell" methodology.
 *
 * Auth: Required (Supabase session via cookies)
 * Rate limit: 10 requests / 60 seconds per user (analysis is expensive)
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - GOOGLE_GENERATIVE_AI_API_KEY (or whichever provider is configured)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { aiChat } from '@/lib/ai/provider';

/** Rate limiter scoped to this route: 10 requests per 60-second window */
const limiter = rateLimit({ limit: 10, windowMs: 60_000 });

/** Zod schema validating the incoming request body */
const analyzeRequestSchema = z.object({
  /** The full call transcript to analyze */
  transcript: z.string().min(10, 'Transcript must be at least 10 characters.'),
  /** Optional call type for more targeted analysis (e.g. 'cold-call', 'follow-up') */
  callType: z.string().optional(),
});

/**
 * System prompt that instructs the AI to analyze the call using Paul Cherry's
 * "Questions That Sell" methodology (Sure -> Want To -> Have To progression).
 */
const ANALYZER_SYSTEM_PROMPT = `You are an expert sales call analyst specializing in Paul Cherry's "Questions That Sell" methodology. Analyze the following call transcript and provide a structured scorecard.

Evaluate the call on these dimensions:
1. **Question Quality** — Did the rep use open-ended questions? Were they thought-provoking?
2. **Sure → Want To → Have To Progression** — Did the rep guide the prospect through Paul Cherry's motivation stages?
3. **Active Listening** — Did the rep demonstrate they heard the prospect (paraphrasing, follow-up questions)?
4. **Pain Discovery** — Were the prospect's core pain points uncovered?
5. **Value Alignment** — Did the rep connect their solution to the prospect's stated needs?
6. **Next Steps** — Was a clear next action established?

For each dimension, provide:
- A score from 1-10
- A brief explanation of what was done well or poorly
- One specific improvement suggestion

End with an overall score and a 2-3 sentence summary of the rep's performance.`;

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
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    /* ── 2. Rate limit by user ID ── */
    const rateLimitResult = limiter(user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait before trying again.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    /* ── 3. Parse and validate the request body ── */
    const body = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body.', details: parsed.error.issues },
        { status: 400 }
      );
    }

    /* ── 4. Build the user message with transcript and optional call type ── */
    const { transcript, callType } = parsed.data;
    const userMessage = callType
      ? `Call type: ${callType}\n\nTranscript:\n${transcript}`
      : `Transcript:\n${transcript}`;

    /* ── 5. Call the AI provider with the analyzer feature and system prompt ── */
    const response = await aiChat(
      {
        messages: [
          { role: 'system', content: ANALYZER_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        feature: 'analyzer',
      },
      user.id
    );

    /* ── 6. Return the analysis result ── */
    return NextResponse.json({
      analysis: response.content,
      tokensUsed: response.tokensUsed,
      provider: response.provider,
      model: response.model,
      latencyMs: response.latencyMs,
    });
  } catch (error) {
    console.error('[API] /api/ai/analyze error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
