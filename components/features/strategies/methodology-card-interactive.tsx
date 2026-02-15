/**
 * components/features/strategies/methodology-card-interactive.tsx
 *
 * Client Component — wraps a methodology card with a drag handle
 * and an enable/disable toggle overlay.
 * Used in the user-facing methodology grid for personal prioritization.
 */

'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Star, GripVertical } from 'lucide-react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import type { MethodologyListItem } from '@/types/methodology';

interface MethodologyCardInteractiveProps {
  methodology: MethodologyListItem;
  techniqueCount: number;
  isEnabled: boolean;
  onToggle: (methodologyId: string, newEnabled: boolean) => void;
  /** Props from @hello-pangea/dnd Draggable — spread onto the handle */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

/** Renders 1-5 stars for relevance rating */
function RelevanceStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 relevance`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

export function MethodologyCardInteractive({
  methodology: m,
  techniqueCount,
  isEnabled,
  onToggle,
  dragHandleProps,
}: MethodologyCardInteractiveProps) {
  const handleToggle = useCallback(() => {
    onToggle(m.id, !isEnabled);
  }, [m.id, isEnabled, onToggle]);

  return (
    <div className={`relative ${!isEnabled ? 'opacity-50' : ''}`}>
      {/* Drag handle — top-left corner */}
      <div
        className="absolute top-2 left-2 z-10 cursor-grab p-1 rounded hover:bg-foreground/10"
        {...(dragHandleProps ?? {})}
      >
        <GripVertical className="h-4 w-4 text-foreground/40" />
      </div>

      {/* Enable/disable toggle — top-right corner */}
      <div className="absolute top-2 right-2 z-10">
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          aria-label={isEnabled ? 'Disable methodology' : 'Enable methodology'}
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-emerald-500' : 'bg-foreground/20'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Card content — links to detail page */}
      <Link href={`/dashboard/strategies/${m.slug}`} className="group block">
        <GlassPanel className="h-full p-5 pt-8 transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="default">{m.category}</Badge>
            <RelevanceStars rating={m.relevance_rating} />
          </div>

          <h3 className="text-lg font-semibold tracking-tight mb-1">{m.name}</h3>
          <p className="text-xs text-foreground/50 mb-2">by {m.author}</p>

          {m.tagline && (
            <p className="text-sm text-foreground/70 line-clamp-2 mb-3">{m.tagline}</p>
          )}

          <div className="flex items-center gap-2 mt-auto pt-2 border-t border-foreground/10">
            <span className="text-xs text-foreground/50 capitalize">{m.complexity_level}</span>
            <span className="text-foreground/20">|</span>
            <span className="text-xs text-foreground/50">
              {techniqueCount} technique{techniqueCount !== 1 ? 's' : ''}
            </span>
            {m.access_tier === 'free' && (
              <>
                <span className="text-foreground/20">|</span>
                <Badge variant="success">Free</Badge>
              </>
            )}
          </div>
        </GlassPanel>
      </Link>
    </div>
  );
}
