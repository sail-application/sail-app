/**
 * app/(dashboard)/strategies/[slug]/page.tsx — Methodology detail page.
 *
 * Server Component that loads a single methodology by slug and displays
 * its full content: description, techniques, videos, books.
 * Also shows the user's preference state (enabled/primary toggle).
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MethodologyDetailHeader } from '@/components/features/strategies/methodology-detail-header';
import { MethodologyTabs } from '@/components/features/strategies/methodology-tabs';
import type { Methodology } from '@/types/methodology';
import type { Strategy } from '@/types/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('methodologies')
    .select('name')
    .eq('slug', slug)
    .single();

  return { title: data?.name ?? 'Methodology Detail' };
}

export default async function MethodologyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch methodology by slug
  const { data: methodology, error } = await supabase
    .from('methodologies')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !methodology) {
    notFound();
  }

  // Fetch child strategies/techniques
  const { data: strategies } = await supabase
    .from('strategies')
    .select('*')
    .eq('methodology_id', methodology.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6">
      <MethodologyDetailHeader methodology={methodology as Methodology} />
      <MethodologyTabs
        methodology={methodology as Methodology}
        strategies={(strategies ?? []) as Strategy[]}
      />
    </div>
  );
}
