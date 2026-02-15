/**
 * components/features/strategies/methodology-card.tsx
 *
 * Server Component — card for a single methodology in the grid.
 * Shows name, author, tagline, category badge, relevance stars,
 * complexity level, and technique count.
 */

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import type { MethodologyListItem } from '@/types/methodology';

interface MethodologyCardProps {
  methodology: MethodologyListItem;
  techniqueCount: number;
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

export function MethodologyCard({ methodology, techniqueCount }: MethodologyCardProps) {
  const m = methodology;

  return (
    <Link href={`/dashboard/strategies/${m.slug}`} className="group">
      <GlassPanel className="h-full p-5 transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg">
        {/* Top row: category badge + relevance */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="default">{m.category}</Badge>
          <RelevanceStars rating={m.relevance_rating} />
        </div>

        {/* Name and author */}
        <h3 className="text-lg font-semibold tracking-tight mb-1">
          {m.name}
        </h3>
        <p className="text-xs text-foreground/50 mb-2">by {m.author}</p>

        {/* Tagline */}
        {m.tagline && (
          <p className="text-sm text-foreground/70 line-clamp-2 mb-3">
            {m.tagline}
          </p>
        )}

        {/* Footer: complexity + technique count */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-foreground/10">
          <span className="text-xs text-foreground/50 capitalize">
            {m.complexity_level}
          </span>
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
  );
}
