/**
 * app/api/ai/practice/route.ts
 *
 * Practice Mode API — manages practice sessions and streams AI responses
 * for real-time roleplay conversations.
 *
 * POST /api/ai/practice
 *   Body: { action: 'start' | 'message', sessionId?: string, messages?: AiMessage[],
 *           methodologyIds?: string[], scenarioDescription?: string }
 *   - action 'start': creates a new practice_sessions row, returns { sessionId }
 *   - action 'message': streams AI roleplay response via SSE (text/event-stream)
 *
 * Auth: Required (Supabase session)
 * Rate limit: 20 requests / 60 seconds per user
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - GOOGLE_GEMINI_API_KEY (or configured provider)
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
import { handleEndSession } from './end-session';

/** Rate limiter: 20 requests per 60-second window (lower than chat — SSE is expensive) */
const limiter = rateLimit({ limit: 20, windowMs: 60_000 });

/** Zod schema for incoming requests */
const practiceRequestSchema = z.discriminatedUnion('action', [
  // Start a new practice session
  z.object({
    action: z.literal('start'),
    scenarioDescription: z.string().max(500).optional(),
    methodologyIds: z.array(z.string().uuid()).max(5).optional(),
    contextPackId: z.string().uuid().optional(),
    sessionConfigId: z.string().uuid().optional(),
  }),
  // Send a message in an active practice session (streams response)
  z.object({
    action: z.literal('message'),
    sessionId: z.string().uuid(),
    messages: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string().min(1).max(8000),
        }),
      )
      .min(1)
      .max(100),
    methodologyIds: z.array(z.string().uuid()).max(5).optional(),
    contextPackId: z.string().uuid().optional(),
  }),
  // End an active practice session — generates AI feedback + persists transcript
  z.object({
    action: z.literal('end'),
    sessionId: z.string().uuid(),
    transcript: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })),
    methodologyIds: z.array(z.string().uuid()).max(5).optional(),
    contextPackId: z.string().uuid().optional(),
    durationSeconds: z.number().int().nonnegative(),
  }),
]);

/**
 * POST /api/ai/practice
 * Handles session creation, streaming message responses, and session end.
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
      trackRateLimitHit('/api/ai/practice');
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait before trying again.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    /* ── 3. Parse and validate ── */
    const body = await request.json();
    const parsed = practiceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body.', details: parsed.error.issues },
        { status: 400 },
      );
    }

    /* ── 4. Route by action ── */
    const data = parsed.data;

    if (data.action === 'start') return handleStartSession(user.id, data);
    if (data.action === 'message') return handleMessage(user.id, data);
    if (data.action === 'end') return handleEndSession(user.id, data);

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    captureError(error, { route: '/api/ai/practice' });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/* ── Action: Start Session ── */

/**
 * Creates a new practice_sessions row and returns the session ID.
 * The client uses this ID to link subsequent message requests to the session.
 */
async function handleStartSession(
  userId: string,
  data: { scenarioDescription?: string; methodologyIds?: string[]; contextPackId?: string; sessionConfigId?: string },
) {
  try {
    const admin = createAdminClient();

    const { data: session, error } = await admin
      .from('practice_sessions')
      .insert({
        user_id: userId,
        status: 'active',
        scenario_description: data.scenarioDescription ?? null,
        context_pack_id: data.contextPackId ?? null,
        session_config_id: data.sessionConfigId ?? null,
        messages: [],
        coach_notes: [],
      })
      .select('id')
      .single();

    if (error || !session) {
      captureError(error, { route: '/api/ai/practice' });
      return NextResponse.json({ error: 'Failed to create practice session.' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    captureError(error, { route: '/api/ai/practice' });
    return NextResponse.json({ error: 'Failed to create practice session.' }, { status: 500 });
  }
}

/* ── Action: Stream Message Response ── */

/**
 * Streams an AI roleplay response via Server-Sent Events (SSE).
 * The AI acts as a prospect in the scenario, and the stream ends when
 * the full response has been generated.
 *
 * SSE format: `data: <chunk>\n\n` for content, `data: [DONE]\n\n` at end.
 */
async function handleMessage(
  userId: string,
  data: {
    sessionId: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    methodologyIds?: string[];
    contextPackId?: string;
  },
) {
  // Verify the session belongs to this user
  try {
    const admin = createAdminClient();
    const { data: session, error } = await admin
      .from('practice_sessions')
      .select('id, status')
      .eq('id', data.sessionId)
      .eq('user_id', userId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active.' }, { status: 409 });
    }
  } catch (error) {
    captureError(error, { route: '/api/ai/practice' });
    return NextResponse.json({ error: 'Failed to verify session.' }, { status: 500 });
  }

  // Resolve methodologies, proficiency, and context pack in parallel
  const [methodologies, proficiencyLevel, contextPack] = await Promise.all([
    resolveMethodologies(userId, data.methodologyIds),
    resolveProficiencyLevel(userId, data.methodologyIds ?? []),
    loadContextPack(data.contextPackId),
  ]);

  // Compose the system prompt with all active methodologies + context pack
  const systemMessages = composeMultiMethodologyPrompt('practice', methodologies, proficiencyLevel, contextPack);
  const hasSystemMessage = data.messages.some((m) => m.role === 'system');
  const finalMessages = hasSystemMessage
    ? data.messages
    : [...systemMessages, ...data.messages];

  // Create and return an SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stream AI response chunks
        for await (const chunk of aiChatStream({ messages: finalMessages, feature: 'practice' })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        // Signal completion
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (streamError) {
        captureError(streamError, { route: '/api/ai/practice' });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted.' })}\n\n`),
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
