/**
 * app/api/methodologies/[slug]/route.ts
 *
 * GET /api/methodologies/:slug — Single methodology with child strategies.
 * Returns full methodology data including AI coaching content.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Fetch the methodology — try slug first, then UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let query = supabase
      .from('methodologies')
      .select('*')
      .eq('is_active', true);

    if (isUuid) {
      query = query.eq('id', slug);
    } else {
      query = query.eq('slug', slug);
    }

    const { data: methodology, error } = await query.single();

    if (error || !methodology) {
      return NextResponse.json({ error: 'Methodology not found' }, { status: 404 });
    }

    // Fetch child strategies/techniques
    const { data: strategies } = await supabase
      .from('strategies')
      .select('*')
      .eq('methodology_id', methodology.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Fetch user's preference for this methodology
    const { data: preference } = await supabase
      .from('user_methodology_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('methodology_id', methodology.id)
      .single();

    return NextResponse.json({
      methodology,
      strategies: strategies ?? [],
      preference: preference ?? null,
    });
  } catch (error) {
    console.error('[API] /api/methodologies/[slug] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
