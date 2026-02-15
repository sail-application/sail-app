/**
 * app/admin/strategies/[id]/page.tsx — Admin methodology edit/create page.
 *
 * Server Component that loads a methodology by ID for editing,
 * or renders an empty form for creating a new methodology.
 * Uses "new" as a special ID value for create mode.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MethodologyForm } from '@/components/features/strategies/admin/methodology-form';
import type { Methodology } from '@/types/methodology';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (id === 'new') return { title: 'New Methodology — Admin' };

  const supabase = await createClient();
  const { data } = await supabase
    .from('methodologies')
    .select('name')
    .eq('id', id)
    .single();

  return { title: `Edit ${data?.name ?? 'Methodology'} — Admin` };
}

export default async function AdminMethodologyEditPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === 'new';
  let methodology: Methodology | null = null;

  if (!isNew) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('methodologies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) notFound();
    methodology = data as Methodology;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-foreground/50">
        <Link href="/admin" className="hover:text-foreground/80">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/strategies" className="hover:text-foreground/80">Methodologies</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">
          {isNew ? 'New' : methodology?.name}
        </span>
      </nav>

      <h2 className="text-2xl font-bold tracking-tight">
        {isNew ? 'Create Methodology' : `Edit: ${methodology?.name}`}
      </h2>

      <MethodologyForm methodology={methodology} />
    </div>
  );
}
