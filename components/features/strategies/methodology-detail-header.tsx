/**
 * components/features/strategies/methodology-detail-header.tsx
 *
 * Hero section for the methodology detail page.
 * Shows name, author, tagline, category, relevance, complexity,
 * trademark attribution, and an enable/disable toggle.
 */

'use client';

import { useState } from 'react';
import { Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import type { Methodology } from '@/types/methodology';

interface MethodologyDetailHeaderProps {
  methodology: Methodology;
  /** Whether this methodology is currently enabled for the user */
  isEnabled?: boolean;
  /** The methodology UUID — needed for the preference API call */
  methodologyId?: string;
}

export function MethodologyDetailHeader({
  methodology: m,
  isEnabled: initialEnabled = false,
  methodologyId,
}: MethodologyDetailHeaderProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [toggling, setToggling] = useState(false);

  /** Toggle the user's enabled/disabled preference via the API */
  async function handleToggle() {
    if (!methodologyId || toggling) return;
    setToggling(true);
    try {
      const res = await fetch('/api/methodologies/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methodology_id: methodologyId,
          is_enabled: !enabled,
        }),
      });
      if (res.ok) {
        setEnabled(!enabled);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setToggling(false);
    }
  }

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

          {/* Enable/Disable toggle */}
          {methodologyId && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                enabled
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'bg-foreground/10 text-foreground/60 hover:bg-foreground/15'
              } disabled:opacity-50`}
            >
              {toggling ? 'Saving...' : enabled ? 'Enabled' : 'Disabled'}
            </button>
          )}
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
