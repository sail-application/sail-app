/**
 * app/(dashboard)/strategies/page.tsx — Methodologies Library listing.
 *
 * Server Component that fetches and displays all active methodologies
 * in a searchable, filterable card grid.
 *
 * Filters: search (text), category (pill), level, author, tier (dropdowns).
 * All managed via URL search params by StrategiesSearch client component.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { StrategiesHeader } from '@/components/features/strategies/strategies-header';
import { StrategiesSearch } from '@/components/features/strategies/strategies-search';
import { MethodologyGrid } from '@/components/features/strategies/methodology-grid';
import { Spinner } from '@/components/ui/spinner';

export const metadata: Metadata = {
  title: 'Methodologies Library',
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    level?: string;
    author?: string;
    tier?: string;
  }>;
}

export default async function StrategiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build the query for listing (no AI content — just display fields)
  let query = supabase
    .from('methodologies')
    .select(
      'id, name, slug, author, tagline, icon, category, relevance_rating, complexity_level, tags, access_tier, sort_order, is_active, trademark_attribution',
      { count: 'exact' },
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Apply filters from URL search params
  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.level) {
    query = query.eq('complexity_level', params.level);
  }
  if (params.author) {
    query = query.eq('author', params.author);
  }
  if (params.tier) {
    query = query.eq('access_tier', params.tier);
  }
  if (params.search) {
    query = query.textSearch('search_vector', params.search, { type: 'websearch' });
  }

  const { data: methodologies, count } = await query;

  // Build unique author list for the Author filter dropdown
  const authors = [
    ...new Set((methodologies ?? []).map((m) => m.author).filter(Boolean)),
  ].sort();

  // Fetch technique counts per methodology
  const ids = (methodologies ?? []).map((m) => m.id);
  let techniqueCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: strategies } = await supabase
      .from('strategies')
      .select('methodology_id')
      .in('methodology_id', ids)
      .eq('is_active', true);

    if (strategies) {
      techniqueCounts = strategies.reduce((acc, s) => {
        const mid = s.methodology_id as string;
        acc[mid] = (acc[mid] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  return (
    <div className="space-y-6">
      <StrategiesHeader total={count ?? 0} />

      <Suspense fallback={<Spinner />}>
        <StrategiesSearch authors={authors} />
      </Suspense>

      <MethodologyGrid
        methodologies={methodologies ?? []}
        techniqueCounts={techniqueCounts}
      />
    </div>
  );
}
