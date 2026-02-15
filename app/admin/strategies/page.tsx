/**
 * app/admin/strategies/page.tsx — Admin methodologies listing.
 *
 * Server Component that shows all methodologies (including inactive)
 * in a table with technique counts. Links to edit pages.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { MethodologyTable } from '@/components/features/strategies/admin/methodology-table';

export const metadata: Metadata = {
  title: 'Manage Methodologies — Admin',
};

export default async function AdminStrategiesPage() {
  const supabase = await createClient();

  /* Fetch all methodologies (including inactive) for admin view */
  const { data: methodologies } = await supabase
    .from('methodologies')
    .select('id, name, slug, author, category, complexity_level, access_tier, sort_order, is_active')
    .order('sort_order', { ascending: true });

  /* Fetch technique counts per methodology */
  const ids = (methodologies ?? []).map((m) => m.id);
  let techniqueCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: strategies } = await supabase
      .from('strategies')
      .select('methodology_id')
      .in('methodology_id', ids);

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
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Methodologies</h2>
          <p className="mt-1 text-foreground/60">
            {(methodologies ?? []).length} total methodologies
          </p>
        </div>
        <Link href="/admin/strategies/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Methodology
          </Button>
        </Link>
      </div>

      <MethodologyTable
        methodologies={methodologies ?? []}
        techniqueCounts={techniqueCounts}
      />
    </div>
  );
}
