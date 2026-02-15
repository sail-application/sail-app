/**
 * app/api/methodologies/preferences/route.ts
 *
 * GET  /api/methodologies/preferences — User's methodology preferences
 * PUT  /api/methodologies/preferences — Update/create a preference
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updatePreferenceSchema } from '@/lib/utils/methodology-validators';

/** GET — Fetch all preferences for the authenticated user */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_methodology_preferences')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences: data ?? [] });
  } catch (error) {
    console.error('[API] preferences GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT — Update or create a methodology preference */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updatePreferenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { methodology_id, is_enabled, is_primary } = parsed.data;

    // If setting as primary, first unset any existing primary
    if (is_primary) {
      await supabase
        .from('user_methodology_preferences')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('is_primary', true);
    }

    // Upsert the preference
    const { data, error } = await supabase
      .from('user_methodology_preferences')
      .upsert(
        {
          user_id: user.id,
          methodology_id,
          is_enabled: is_enabled ?? true,
          is_primary: is_primary ?? false,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,methodology_id' },
      )
      .select()
      .single();

    if (error) {
      console.error('[API] preferences PUT error:', error);
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
    }

    return NextResponse.json({ preference: data });
  } catch (error) {
    console.error('[API] preferences PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
