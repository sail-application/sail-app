/**
 * components/features/strategies/technique-list.tsx
 *
 * Server Component — expandable list of technique/strategy cards.
 * Each card shows title, description, and can expand for full content.
 */

import { GlassPanel } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';
import type { Strategy } from '@/types/database';

interface TechniqueListProps {
  strategies: Strategy[];
}

export function TechniqueList({ strategies }: TechniqueListProps) {
  if (strategies.length === 0) {
    return <p className="text-center py-8 text-foreground/50">No techniques yet.</p>;
  }

  return (
    <div className="space-y-3">
      {strategies.map((strategy) => (
        <GlassPanel key={strategy.id} blur="light" className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{strategy.title}</h4>
              {strategy.description && (
                <p className="text-xs text-foreground/60 mt-1">{strategy.description}</p>
              )}
              {strategy.content && (
                <p className="text-sm text-foreground/80 mt-2 whitespace-pre-line">
                  {strategy.content}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {strategy.tags?.map((tag) => (
                <Badge key={tag} variant="info">{tag}</Badge>
              ))}
            </div>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
