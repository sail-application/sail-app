/**
 * app/api/ai/live-call/checklist/route.ts
 *
 * Dynamic checklist update endpoint for Live Call Assistant.
 *
 * POST /api/ai/live-call/checklist
 *   Body: { sessionId, transcript, checklistItems }
 *
 * The AI analyzes the latest transcript and determines which checklist items
 * have been covered (budget mentioned, timeline established, decision-maker
 * identified, etc.). Returns the updated checklist_state object.
 *
 * This is a non-streaming request (the full checklist update is needed
 * before re-rendering the checklist). Typical latency: <1s.
 *
 * Auth: Required
 * Rate limit: 30 requests / 60 seconds (called less frequently than coaching)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';
import { aiChat } from '@/lib/ai/provider';
import { captureError, trackRateLimitHit } from '@/lib/sentry';

const limiter = rateLimit({ limit: 30, windowMs: 60_000 });

const checklistRequestSchema = z.object({
  /** The live call session this checklist belongs to */
  sessionId: z.string().uuid(),
  /** Latest conversation transcript */
  transcript: z.string().max(15000),
  /** List of checklist item keys to evaluate (e.g. ['budget', 'timeline', 'decision_maker']) */
  checklistItems: z.array(z.string().max(50)).max(20),
  /** Current state so the AI doesn't re-analyze already-checked items */
  currentState: z.record(z.string(), z.boolean()).optional(),
});

/**
 * POST /api/ai/live-call/checklist
 * Analyzes the transcript and returns which checklist items are now covered.
 */
export async function POST(request: NextRequest) {
  try {
    /* ── 1. Authenticate ── */
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    /* ── 2. Rate limit ── */
    const rateLimitResult = limiter(user.id);
    if (!rateLimitResult.success) {
      trackRateLimitHit('/api/ai/live-call/checklist');
      return NextResponse.json(
        { error: 'Too many requests.', retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000) },
        { status: 429 },
      );
    }

    /* ── 3. Parse ── */
    const body = await request.json();
    const parsed = checklistRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body.', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { sessionId, transcript, checklistItems, currentState = {} } = parsed.data;

    // Only analyze items that aren't already checked
    const uncheckedItems = checklistItems.filter((item) => !currentState[item]);
    if (uncheckedItems.length === 0) {
      return NextResponse.json({ checklistState: currentState });
    }

    /* ── 4. Ask the AI which items are covered ── */
    const prompt = `You are analyzing a sales conversation transcript to determine which checklist items have been addressed.

TRANSCRIPT:
${transcript}

CHECKLIST ITEMS TO EVALUATE (only these — return JSON only):
${uncheckedItems.map((item) => `- ${item}`).join('\n')}

For each item, determine if it was clearly addressed in the transcript (true) or not (false).
Respond ONLY with valid JSON in this exact format:
{"budget": true, "timeline": false, ...}

Use exactly the same keys as the checklist items above.`;

    const response = await aiChat({
      messages: [
        { role: 'system', content: 'You are a precise JSON-only responder. Output only valid JSON, no explanation.' },
        { role: 'user', content: prompt },
      ],
      feature: 'live-call',
      maxTokens: 200,
      temperature: 0.1, // Low temperature for deterministic JSON output
    });

    /* ── 5. Parse AI response as JSON ── */
    let aiChecklist: Record<string, boolean> = {};
    try {
      // Extract JSON from response (AI might wrap it in ```json blocks)
      const raw = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiChecklist = JSON.parse(raw);
    } catch {
      // If parsing fails, leave the unchecked items unchanged
      console.warn('[LiveCall/Checklist] Failed to parse AI checklist response:', response.content);
    }

    // Merge AI results with existing state
    const updatedState = { ...currentState, ...aiChecklist };

    /* ── 6. Persist updated checklist state to the session ── */
    try {
      const admin = createAdminClient();
      await admin
        .from('live_call_sessions')
        .update({ checklist_state: updatedState })
        .eq('id', sessionId)
        .eq('user_id', user.id);
    } catch (dbError) {
      // Non-fatal: return the state even if the DB write fails
      captureError(dbError, { route: '/api/ai/live-call/checklist' });
    }

    return NextResponse.json({ checklistState: updatedState });
  } catch (error) {
    captureError(error, { route: '/api/ai/live-call/checklist' });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
