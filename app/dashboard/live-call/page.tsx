/**
 * app/(dashboard)/live-call/page.tsx — Live Call Assistant page.
 *
 * Server Component that fetches the user's enabled methodologies,
 * then renders the CallCockpit client component which manages
 * the full call lifecycle (setup → active → post-call summary).
 *
 * Data fetched here (server-side):
 *   - User session (for userId)
 *   - User's enabled methodologies (for the methodology selector)
 */

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CallCockpit } from '@/components/features/live-call/call-cockpit';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

export const metadata: Metadata = {
  title: 'Live Call Assistant',
};

/**
 * LiveCallPage — Server component wrapper for the Live Call Assistant.
 * Fetches methodology data and passes it to the client cockpit component.
 */
export default async function LiveCallPage() {
  const supabase = await createClient();

  /* ── Fetch the current user ── */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let methodologies: MethodologyListItem[] = [];
  let contextPacks: ContextPackOption[] = [];

  if (user) {
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

  return <CallCockpit methodologies={methodologies} contextPacks={contextPacks} />;
}
