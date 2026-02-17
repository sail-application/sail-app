/**
 * app/api/session-configs/route.ts
 *
 * CRUD API for session_configurations (saved practice/call setups).
 *
 * GET  ?sessionType=practice|live-call  — list user's configs (default first)
 * POST                                  — create config
 * PATCH                                 — update config (rename, set default)
 * DELETE ?id=<uuid>                     — delete config
 *
 * Auth: Required
 * Rate limit: 20 / 60s
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';
import { captureError, trackRateLimitHit } from '@/lib/sentry';

const limiter = rateLimit({ limit: 20, windowMs: 60_000 });

const createSchema = z.object({
  name: z.string().min(1).max(100),
  session_type: z.enum(['practice', 'live-call']),
  methodology_ids: z.array(z.string().uuid()).max(5),
  context_pack_id: z.string().uuid().optional().nullable(),
  is_default: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  is_default: z.boolean().optional(),
  context_pack_id: z.string().uuid().optional().nullable(),
});

async function getAuthUser(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const result = limiter(user.id);
  if (!result.success) {
    trackRateLimitHit('/api/session-configs');
    return 'rate_limited' as const;
  }
  return user;
}

/** GET — list configs for a session type */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (user === 'rate_limited') return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const sessionType = request.nextUrl.searchParams.get('sessionType');

  try {
    const admin = createAdminClient();
    let query = admin
      .from('session_configurations')
      .select('id, name, session_type, methodology_ids, context_pack_id, is_default, created_at')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (sessionType) {
      query = query.eq('session_type', sessionType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ configs: data ?? [] });
  } catch (error) {
    captureError(error, { route: '/api/session-configs' });
    return NextResponse.json({ error: 'Failed to fetch configs.' }, { status: 500 });
  }
}

/** POST — create a new config */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (user === 'rate_limited') return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.', details: parsed.error.issues }, { status: 400 });

  try {
    const admin = createAdminClient();

    // If this is being set as default, clear existing defaults for this session type
    if (parsed.data.is_default) {
      await admin
        .from('session_configurations')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('session_type', parsed.data.session_type)
        .eq('is_default', true);
    }

    const { data, error } = await admin
      .from('session_configurations')
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        session_type: parsed.data.session_type,
        methodology_ids: parsed.data.methodology_ids,
        context_pack_id: parsed.data.context_pack_id ?? null,
        is_default: parsed.data.is_default ?? false,
      })
      .select('id, name, session_type, methodology_ids, context_pack_id, is_default')
      .single();

    if (error || !data) throw error;
    return NextResponse.json({ config: data }, { status: 201 });
  } catch (error) {
    captureError(error, { route: '/api/session-configs' });
    return NextResponse.json({ error: 'Failed to create config.' }, { status: 500 });
  }
}

/** PATCH — update an existing config */
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (user === 'rate_limited') return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.', details: parsed.error.issues }, { status: 400 });

  try {
    const admin = createAdminClient();

    // If setting as default, clear existing defaults first
    if (parsed.data.is_default === true) {
      const { data: existing } = await admin
        .from('session_configurations')
        .select('session_type')
        .eq('id', parsed.data.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        await admin
          .from('session_configurations')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('session_type', existing.session_type)
          .eq('is_default', true);
      }
    }

    const { error } = await admin
      .from('session_configurations')
      .update({
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.is_default !== undefined && { is_default: parsed.data.is_default }),
        ...(parsed.data.context_pack_id !== undefined && { context_pack_id: parsed.data.context_pack_id }),
      })
      .eq('id', parsed.data.id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error, { route: '/api/session-configs' });
    return NextResponse.json({ error: 'Failed to update config.' }, { status: 500 });
  }
}

/** DELETE — remove a config */
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (user === 'rate_limited') return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id parameter.' }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('session_configurations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error, { route: '/api/session-configs' });
    return NextResponse.json({ error: 'Failed to delete config.' }, { status: 500 });
  }
}
