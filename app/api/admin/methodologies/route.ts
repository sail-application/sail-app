/**
 * app/api/admin/methodologies/route.ts
 *
 * GET  /api/admin/methodologies — List all methodologies (incl. inactive)
 * POST /api/admin/methodologies — Create a new methodology
 *
 * Admin-only. Checks user_roles for admin permission.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createMethodologySchema } from '@/lib/utils/methodology-validators';

/** Helper: checks if the current user is an admin */
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  return !!data;
}

/** GET — List all methodologies (admin sees inactive too) */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('methodologies')
      .select('id, name, slug, author, category, complexity_level, access_tier, sort_order, is_active, created_at')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Get technique counts
    const { data: strategies } = await supabase
      .from('strategies')
      .select('methodology_id')
      .eq('is_active', true);

    const counts: Record<string, number> = {};
    strategies?.forEach((s) => {
      const mid = s.methodology_id as string;
      if (mid) counts[mid] = (counts[mid] ?? 0) + 1;
    });

    return NextResponse.json({ methodologies: data ?? [], techniqueCounts: counts });
  } catch (error) {
    console.error('[API] admin methodologies GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST — Create a new methodology */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createMethodologySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('methodologies')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      console.error('[API] admin methodologies POST error:', error);
      return NextResponse.json({ error: 'Failed to create methodology' }, { status: 500 });
    }

    return NextResponse.json({ methodology: data }, { status: 201 });
  } catch (error) {
    console.error('[API] admin methodologies POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
