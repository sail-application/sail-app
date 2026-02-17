/**
 * app/api/ai/analyze/route.ts
 *
 * Post-call analysis endpoint. Accepts a call transcript and returns a
 * structured JSON scorecard using multi-methodology prompting.
 *
 * Auth: Required
 * Rate limit: 10 / 60s (analysis is expensive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { aiChat } from '@/lib/ai/provider';
import { resolveMethodologies } from '@/lib/ai/methodology-resolver';
import { composeMultiMethodologyPrompt } from '@/lib/ai/prompt-composer';
import { resolveProficiencyLevel } from '@/lib/ai/proficiency-resolver';
import { loadContextPack } from '@/lib/ai/context-pack-loader';
import { captureError, trackRateLimitHit, trackCallAnalyzed } from '@/lib/sentry';

const limiter = rateLimit({ limit: 10, windowMs: 60_000 });

const analyzeRequestSchema = z.object({
  transcript: z.string().min(10, 'Transcript must be at least 10 characters.'),
  callType: z.string().optional(),
  methodologyIds: z.array(z.string().uuid()).max(5).optional(),
  contextPackId: z.string().uuid().optional(),
});

/**
 * POST /api/ai/analyze
 * Returns a structured JSON scorecard: { overall_score, dimensions, strengths, weaknesses, action_items }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const rateLimitResult = limiter(user.id);
    if (!rateLimitResult.success) {
      trackRateLimitHit('/api/ai/analyze');
      return NextResponse.json(
        { error: 'Too many requests.', retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000) },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsed.error.issues }, { status: 400 });
    }

    const { transcript, callType, methodologyIds, contextPackId } = parsed.data;

    // Resolve methodologies, proficiency, and context pack in parallel
    const [methodologies, proficiencyLevel, contextPack] = await Promise.all([
      resolveMethodologies(user.id, methodologyIds),
      resolveProficiencyLevel(user.id, methodologyIds ?? []),
      loadContextPack(contextPackId),
    ]);

    const systemMessages = composeMultiMethodologyPrompt('analyzer', methodologies, proficiencyLevel, contextPack);

    // Request structured JSON output for easy frontend rendering
    const userMessage = (callType ? `Call type: ${callType}\n\n` : '') +
      `Transcript:\n${transcript}\n\n` +
      `Respond with ONLY a JSON object (no markdown):\n` +
      `{"overall_score":0-100,"dimensions":{"rapport":0-10,"discovery":0-10,"objection_handling":0-10,"close":0-10},"strengths":["..."],"weaknesses":["..."],"action_items":["..."]}`;

    const response = await aiChat(
      { messages: [...systemMessages, { role: 'user', content: userMessage }], feature: 'analyzer' },
      user.id,
    );

    // Parse the JSON response (strip fences if present)
    let scorecard: Record<string, unknown> = {};
    try {
      const stripped = response.content.replace(/^```json\s*|\s*```$/gm, '').trim();
      scorecard = JSON.parse(stripped);
    } catch {
      // Return raw content if JSON parsing fails
      scorecard = { raw: response.content };
    }

    trackCallAnalyzed();
    return NextResponse.json({
      scorecard,
      methodologies: methodologies.map((m) => ({ id: m.id, name: m.name })),
      tokensUsed: response.tokensUsed,
      provider: response.provider,
      model: response.model,
    });
  } catch (error) {
    captureError(error, { route: '/api/ai/analyze' });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
