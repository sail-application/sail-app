/**
 * app/(dashboard)/strategies/page.tsx — Strategies Library placeholder.
 *
 * Server Component placeholder for the Strategies Library feature.
 * Displays the feature name, icon, and "Coming soon" message.
 * Will be replaced with a searchable library of Paul Cherry's
 * "Questions That Sell" methodology techniques.
 */

import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

export const metadata: Metadata = {
  title: 'Strategies Library',
};

/** StrategiesPage — Placeholder for the methodology techniques library. */
export default function StrategiesPage() {
  return (
    <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-600 mb-4">
        <BookOpen className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Strategies Library</h2>
      <p className="text-foreground/60 max-w-md">
        Searchable Paul Cherry &quot;Questions That Sell&quot; methodology techniques. Coming soon.
      </p>
    </GlassPanel>
  );
}
