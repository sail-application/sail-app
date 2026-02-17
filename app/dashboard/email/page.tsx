/**
 * app/(dashboard)/email/page.tsx — Email Composition page.
 *
 * Server Component that fetches methodologies and context packs,
 * then renders the EmailComposer client component.
 */

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { EmailComposer } from '@/components/features/email/email-composer';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

export const metadata: Metadata = {
  title: 'Email Composition',
};

export default async function EmailPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  return <EmailComposer methodologies={methodologies} contextPacks={contextPacks} />;
}
