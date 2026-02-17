/**
 * app/(dashboard)/practice/page.tsx — Practice Mode page.
 *
 * Server Component that fetches the user's enabled methodologies,
 * then renders the PracticeSession client component which manages
 * the full session lifecycle (setup → roleplay → summary).
 *
 * Data fetched here (server-side):
 *   - User session (for userId)
 *   - User's enabled methodologies (for the methodology selector)
 */

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PracticeSession } from '@/components/features/practice/practice-session';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

export const metadata: Metadata = {
  title: 'Practice Mode',
};

/**
 * PracticePage — Server component wrapper for Practice Mode.
 * Fetches methodology data and passes it to the client session component.
 */
export default async function PracticePage() {
  const supabase = await createClient();

  /* ── Fetch the current user ── */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let methodologies: MethodologyListItem[] = [];
  let contextPacks: ContextPackOption[] = [];

  if (user) {
    /* ── Fetch methodologies and context packs in parallel ── */
    const [methodologiesResult, contextPacksResult] = await Promise.all([
      supabase
        .from('user_methodology_preferences')
        .select(`
          methodology_id,
          sort_order,
          methodologies (
            id, name, slug, author, tagline,
            icon, category, relevance_rating, complexity_level,
            tags, access_tier, sort_order, is_active,
            trademark_attribution
          )
        `)
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('context_packs')
        .select('id, name, slug, description, icon')
        .eq('is_active', true)
        .order('name'),
    ]);

    methodologies = (methodologiesResult.data ?? [])
      .map((row) => row.methodologies as unknown as MethodologyListItem)
      .filter((m): m is MethodologyListItem => m !== null && m.is_active);

    contextPacks = (contextPacksResult.data ?? []) as ContextPackOption[];
  }

  return <PracticeSession methodologies={methodologies} contextPacks={contextPacks} />;
}
