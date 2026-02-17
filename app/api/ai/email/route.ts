/**
 * app/api/ai/email/route.ts
 *
 * AI-assisted email composition endpoint.
 *
 * POST /api/ai/email
 *   - action 'draft': generate initial email draft
 *   - action 'refine': refine existing draft based on feedback
 *
 * Auth: Required
 * Rate limit: 10 / 60s
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
import { captureError, trackRateLimitHit } from '@/lib/sentry';

const limiter = rateLimit({ limit: 10, windowMs: 60_000 });

const emailRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('draft'),
    recipientContext: z.string().min(1).max(500),
    objective: z.string().min(1).max(500),
    tone: z.enum(['formal', 'casual', 'assertive']),
    methodologyIds: z.array(z.string().uuid()).max(5).optional(),
    contextPackId: z.string().uuid().optional(),
  }),
  z.object({
    action: z.literal('refine'),
    currentDraft: z.string().min(1).max(5000),
    feedback: z.string().min(1).max(500),
    methodologyIds: z.array(z.string().uuid()).max(5).optional(),
    contextPackId: z.string().uuid().optional(),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const rateLimitResult = limiter(user.id);
    if (!rateLimitResult.success) {
      trackRateLimitHit('/api/ai/email');
      return NextResponse.json(
        { error: 'Too many requests.', retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000) },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = emailRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    // Resolve methodology context
    const [methodologies, proficiencyLevel, contextPack] = await Promise.all([
      resolveMethodologies(user.id, data.methodologyIds),
      resolveProficiencyLevel(user.id, data.methodologyIds ?? []),
      loadContextPack(data.contextPackId),
    ]);

    const systemMessages = composeMultiMethodologyPrompt('email', methodologies, proficiencyLevel, contextPack);

    let userMessage: string;

    if (data.action === 'draft') {
      const toneGuide = { formal: 'professional and formal', casual: 'warm and conversational', assertive: 'confident and direct' }[data.tone];
      userMessage = `Write a ${toneGuide} sales outreach email.\n\n` +
        `Who you're emailing: ${data.recipientContext}\n` +
        `Goal of this email: ${data.objective}\n\n` +
        `Requirements:\n` +
        `- Subject line first\n` +
        `- 3-5 short paragraphs\n` +
        `- Clear call-to-action at the end\n` +
        `- Apply your active coaching methodology naturally\n` +
        `- NO generic templates — make it specific to the recipient context`;
    } else {
      userMessage = `Here is the current email draft:\n\n${data.currentDraft}\n\n` +
        `Feedback to apply: ${data.feedback}\n\n` +
        `Rewrite the email incorporating this feedback. Keep what's working, fix what's not.`;
    }

    const response = await aiChat(
      { messages: [...systemMessages, { role: 'user', content: userMessage }], feature: 'email' },
      user.id,
    );

    return NextResponse.json({
      draft: response.content,
      tokensUsed: response.tokensUsed,
      provider: response.provider,
      model: response.model,
    });
  } catch (error) {
    captureError(error, { route: '/api/ai/email' });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
