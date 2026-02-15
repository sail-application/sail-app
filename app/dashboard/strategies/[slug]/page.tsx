/**
 * app/(dashboard)/strategies/[slug]/page.tsx — Methodology detail page.
 *
 * Server Component that loads a single methodology by slug and displays
 * its full content: description, techniques, videos, books.
 * Also checks admin role (for AI Data tab) and user preference (toggle).
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

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

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

  // Check if user has admin role (for AI Data tab visibility)
  let isAdmin = false;
  if (user) {
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    isAdmin = role?.role === 'admin';
  }

  // Fetch user's preference for this methodology (for enable/disable toggle)
  let isEnabled = slug === 'questions-that-sell'; // Paul Cherry ON by default
  if (user) {
    const { data: pref } = await supabase
      .from('user_methodology_preferences')
      .select('is_enabled')
      .eq('user_id', user.id)
      .eq('methodology_id', methodology.id)
      .single();

    // If a preference row exists, use it; otherwise fall back to default
    if (pref) {
      isEnabled = pref.is_enabled;
    }
  }

  return (
    <div className="space-y-6">
      <MethodologyDetailHeader
        methodology={methodology as Methodology}
        isEnabled={isEnabled}
        methodologyId={methodology.id}
      />
      <MethodologyTabs
        methodology={methodology as Methodology}
        strategies={(strategies ?? []) as Strategy[]}
        isAdmin={isAdmin}
      />
    </div>
  );
}
