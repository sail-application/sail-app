'use client';

/**
 * components/features/shared/context-pack-selector.tsx
 *
 * Dropdown/card selector for choosing an industry context pack.
 * Context packs inject domain-specific vocabulary and personas into
 * the AI without replacing the active methodology.
 *
 * Used by: Practice Mode session setup, Live Call setup.
 *
 * Props:
 *   - packs: list of available context packs from the database
 *   - selectedId: currently selected pack ID (null = no industry context)
 *   - onChange: callback when the selection changes
 */

import { useState } from 'react';

export interface ContextPackOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface ContextPackSelectorProps {
  packs: ContextPackOption[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  label?: string;
}

/**
 * ContextPackSelector — Card-based industry context picker.
 * "None" is always the first option (generic coaching mode).
 * Selecting a pack shows its description below the cards.
 */
export function ContextPackSelector({
  packs,
  selectedId,
  onChange,
  label = 'Industry Context (optional)',
}: ContextPackSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const selectedPack = packs.find((p) => p.id === selectedId);
  const hoveredPack = packs.find((p) => p.id === hovered);
  const previewPack = hoveredPack ?? selectedPack;

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-foreground/80">{label}</span>

      <div className="flex flex-wrap gap-2">
        {/* "None" option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          onMouseEnter={() => setHovered('none')}
          onMouseLeave={() => setHovered(null)}
          aria-pressed={selectedId === null}
          className={[
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
            'border transition-all duration-150 cursor-pointer select-none',
            selectedId === null
              ? 'border-brand-600 bg-brand-600/15 text-brand-600'
              : 'border-foreground/20 bg-transparent text-foreground/70 hover:border-foreground/40',
          ].join(' ')}
        >
          <span>🌐</span>
          <span>General</span>
          {selectedId === null && <span className="ml-0.5 text-brand-600">✓</span>}
        </button>

        {/* Pack chips */}
        {packs.map((pack) => {
          const isSelected = selectedId === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => onChange(isSelected ? null : pack.id)}
              onMouseEnter={() => setHovered(pack.id)}
              onMouseLeave={() => setHovered(null)}
              aria-pressed={isSelected}
              className={[
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
                'border transition-all duration-150 cursor-pointer select-none',
                isSelected
                  ? 'border-brand-600 bg-brand-600/15 text-brand-600'
                  : 'border-foreground/20 bg-transparent text-foreground/70 hover:border-foreground/40',
              ].join(' ')}
            >
              {pack.icon && <span className="text-base leading-none">{pack.icon}</span>}
              <span>{pack.name}</span>
              {isSelected && <span className="ml-0.5 text-brand-600">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Description for hovered/selected pack */}
      {previewPack && (
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm text-foreground/70">
          <span className="font-medium text-foreground">{previewPack.name}</span>
          {previewPack.description && (
            <span className="ml-2 text-foreground/60">— {previewPack.description}</span>
          )}
        </div>
      )}
      {!previewPack && hovered === 'none' && (
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm text-foreground/70">
          <span className="font-medium text-foreground">General</span>
          <span className="ml-2 text-foreground/60">
            — No industry-specific context. The AI adapts to whatever topic you practice.
          </span>
        </div>
      )}
    </div>
  );
}
