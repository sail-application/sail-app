/**
 * components/features/strategies/methodology-detail-header.tsx
 *
 * Server Component — hero section for the methodology detail page.
 * Shows name, author, tagline, category, relevance, complexity,
 * and trademark attribution.
 */

import { Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import type { Methodology } from '@/types/methodology';

interface MethodologyDetailHeaderProps {
  methodology: Methodology;
}

export function MethodologyDetailHeader({ methodology: m }: MethodologyDetailHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/strategies"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Methodologies
      </Link>

      <GlassPanel className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">{m.category}</Badge>
              <span className="text-xs text-foreground/50 capitalize">
                {m.complexity_level}
              </span>
              {m.access_tier === 'free' && <Badge variant="success">Free</Badge>}
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-1">{m.name}</h1>
            <p className="text-foreground/60 mb-2">by {m.author}</p>

            {m.tagline && (
              <p className="text-foreground/80 text-lg">{m.tagline}</p>
            )}

            {/* Relevance stars */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-foreground/50">Relevance:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < m.relevance_rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-foreground/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trademark attribution */}
        {m.trademark_attribution && (
          <p className="mt-4 text-xs text-foreground/40 border-t border-foreground/10 pt-3">
            {m.trademark_attribution}
          </p>
        )}
      </GlassPanel>
    </div>
  );
}
