/**
 * app/api/ai/live-call/route.ts
 *
 * Live Call Assistant API — streams real-time coaching suggestions
 * as the conversation transcript grows.
 *
 * POST /api/ai/live-call
 *   Body: { action: 'start' | 'coach', sessionId?: string,
 *           transcript?: string, methodologyIds?: string[] }
 *
 *   - action 'start': Creates a live_call_sessions row, returns { sessionId }
 *   - action 'coach': Given the latest transcript chunk, streams 1-2 sentence
 *                     coaching suggestion via SSE. Target latency: <2s.
 *   - action 'end': Marks the session completed, records duration
 *
 * Auth: Required (Supabase session)
 * Rate limit: 60 requests / 60 seconds per user (higher limit — called frequently)
 *
 * Provider: Gemini Flash (configured in ai_provider_configs for 'live-call' feature)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';
import { aiChatStream } from '@/lib/ai/provider';
import { resolveMethodologies } from '@/lib/ai/methodology-resolver';
import { composeMultiMethodologyPrompt } from '@/lib/ai/prompt-composer';
import { resolveProficiencyLevel } from '@/lib/ai/proficiency-resolver';
import { loadContextPack } from '@/lib/ai/context-pack-loader';
import { captureError, trackRateLimitHit } from '@/lib/sentry';

/** Higher rate limit for live-call — coaching requests fire every few seconds */
const limiter = rateLimit({ limit: 60, windowMs: 60_000 });

const liveCallRequestSchema = z.discriminatedUnion('action', [
  // Start a new live call session
  z.object({
    action: z.literal('start'),
    methodologyIds: z.array(z.string().uuid()).max(5).optional(),
    contextPackId: z.string().uuid().optional(),
    sessionConfigId: z.string().uuid().optional(),
  }),
  // Get a coaching suggestion for the latest transcript chunk
  z.object({
    action: z.literal('coach'),
    sessionId: z.string().uuid(),
    transcript: z.string().max(10000),
    methodologyIds: z.array(z.string().uuid()).max(5).optional(),
    contextPackId: z.string().uuid().optional(),
  }),
  // End the session and record its duration
  z.object({
    action: z.literal('end'),
    sessionId: z.string().uuid(),
    durationSeconds: z.number().int().nonnegative(),
    transcript: z.string().optional(),
    coachingEvents: z.array(z.object({
      id: z.string(),
      timestamp: z.string(),
      content: z.string(),
    })).optional(),
    checklistState: z.record(z.string(), z.boolean()).optional(),
  }),
]);

/**
 * POST /api/ai/live-call
 * Routes to start, coach, or end handlers based on the action field.
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
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    /* ── 2. Rate limit ── */
    const rateLimitResult = limiter(user.id);
    if (!rateLimitResult.success) {
      trackRateLimitHit('/api/ai/live-call');
      return NextResponse.json(
        {
          error: 'Too many requests.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    /* ── 3. Parse and validate ── */
    const body = await request.json();
    const parsed = liveCallRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body.', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (data.action === 'start') return handleStart(user.id, data);
    if (data.action === 'coach') return handleCoach(user.id, data);
    if (data.action === 'end') return handleEnd(user.id, data);

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    captureError(error, { route: '/api/ai/live-call' });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/* ── Action: Start Session ── */

async function handleStart(
  userId: string,
  data: { methodologyIds?: string[]; contextPackId?: string; sessionConfigId?: string },
) {
  try {
    const admin = createAdminClient();

    const { data: session, error } = await admin
      .from('live_call_sessions')
      .insert({
        user_id: userId,
        status: 'active',
        context_pack_id: data.contextPackId ?? null,
        session_config_id: data.sessionConfigId ?? null,
        transcript: [],
        coaching_events: [],
        checklist_state: {},
        qualification_data: {},
      })
      .select('id')
      .single();

    if (error || !session) {
      captureError(error, { route: '/api/ai/live-call' });
      return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    captureError(error, { route: '/api/ai/live-call' });
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
  }
}

/* ── Action: Stream Coaching Suggestion ── */

/**
 * Given the latest transcript, asks the AI for a 1-2 sentence coaching
 * suggestion. Uses the live-call feature which minimizes context for speed.
 * Target latency: <2 seconds to first token.
 */
async function handleCoach(
  userId: string,
  data: { sessionId: string; transcript: string; methodologyIds?: string[]; contextPackId?: string },
) {
  // Security: verify session ownership before consuming AI resources
  try {
    const admin = createAdminClient();
    const { data: session, error } = await admin
      .from('live_call_sessions')
      .select('id')
      .eq('id', data.sessionId)
      .eq('user_id', userId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
  } catch (err) {
    captureError(err, { route: '/api/ai/live-call' });
    return NextResponse.json({ error: 'Failed to verify session.' }, { status: 500 });
  }

  const [methodologies, proficiencyLevel, contextPack] = await Promise.all([
    resolveMethodologies(userId, data.methodologyIds),
    resolveProficiencyLevel(userId, data.methodologyIds ?? []),
    loadContextPack(data.contextPackId),
  ]);
  const systemMessages = composeMultiMethodologyPrompt('live-call', methodologies, proficiencyLevel, contextPack);

  // Build a minimal prompt — only the latest transcript chunk
  const messages = [
    ...systemMessages,
    {
      role: 'user' as const,
      content: `Latest conversation transcript:\n\n${data.transcript}\n\nGive me one specific, actionable coaching tip for right now. Be concise — max 2 sentences.`,
    },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of aiChatStream({ messages, feature: 'live-call' })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (streamError) {
        captureError(streamError, { route: '/api/ai/live-call' });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed.' })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/* ── Action: End Session ── */

async function handleEnd(
  userId: string,
  data: {
    sessionId: string;
    durationSeconds: number;
    transcript?: string;
    coachingEvents?: Array<{ id: string; timestamp: string; content: string }>;
    checklistState?: Record<string, boolean>;
  },
) {
  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from('live_call_sessions')
      .update({
        status: 'completed',
        duration_seconds: data.durationSeconds,
        completed_at: new Date().toISOString(),
        ...(data.transcript !== undefined && { transcript: data.transcript }),
        ...(data.coachingEvents !== undefined && { coaching_events: data.coachingEvents }),
        ...(data.checklistState !== undefined && { checklist_state: data.checklistState }),
      })
      .eq('id', data.sessionId)
      .eq('user_id', userId);

    if (error) {
      captureError(error, { route: '/api/ai/live-call' });
      return NextResponse.json({ error: 'Failed to end session.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error, { route: '/api/ai/live-call' });
    return NextResponse.json({ error: 'Failed to end session.' }, { status: 500 });
  }
}
