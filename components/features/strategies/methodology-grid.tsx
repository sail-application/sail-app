/**
 * components/features/strategies/methodology-grid.tsx
 *
 * Server Component — responsive grid of methodology cards.
 * Renders 3 cols on desktop, 2 on tablet, 1 on mobile.
 */

import { MethodologyCard } from './methodology-card';
import type { MethodologyListItem } from '@/types/methodology';

interface MethodologyGridProps {
  methodologies: MethodologyListItem[];
  techniqueCounts: Record<string, number>;
}

export function MethodologyGrid({ methodologies, techniqueCounts }: MethodologyGridProps) {
  if (methodologies.length === 0) {
    return (
      <div className="text-center py-12 text-foreground/50">
        <p className="text-lg font-medium mb-1">No methodologies found</p>
        <p className="text-sm">Try adjusting your search or filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {methodologies.map((m) => (
        <MethodologyCard
          key={m.id}
          methodology={m}
          techniqueCount={techniqueCounts[m.id] ?? 0}
        />
      ))}
    </div>
  );
}
