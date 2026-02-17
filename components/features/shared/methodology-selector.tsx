'use client';

/**
 * components/features/shared/methodology-selector.tsx
 *
 * Reusable multi-select methodology picker.
 * Shows the user's enabled methodologies as toggleable chips.
 * Supports selecting multiple methodologies simultaneously (e.g., BANT + MEDPIC).
 *
 * Used by: Practice Mode session setup, Live Call setup, Call Analyzer.
 *
 * Props:
 *   - methodologies: list of the user's enabled methodologies
 *   - selected: currently selected methodology IDs
 *   - onChange: callback when selection changes
 *   - maxSelections: optional cap (default: no limit)
 */

import { useState } from 'react';
import type { MethodologyListItem } from '@/types/methodology';

interface MethodologySelectorProps {
  /** All methodologies the user has enabled */
  methodologies: MethodologyListItem[];
  /** Currently selected methodology IDs */
  selected: string[];
  /** Called with the new selected IDs array whenever the selection changes */
  onChange: (ids: string[]) => void;
  /** Optional max number of simultaneous selections */
  maxSelections?: number;
  /** Optional label above the selector */
  label?: string;
}

/**
 * MethodologySelector — Multi-select chip list for choosing active methodologies.
 * Each chip shows the methodology icon and name. Click to toggle on/off.
 * When maxSelections is reached, unselected chips are disabled.
 */
export function MethodologySelector({
  methodologies,
  selected,
  onChange,
  maxSelections,
  label = 'Active Methodologies',
}: MethodologySelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Find which methodology is hovered (for the description tooltip)
  const hoveredMethodology = methodologies.find((m) => m.id === hovered);

  /**
   * Toggle a methodology on or off.
   * If maxSelections is set and already reached, ignore the toggle for unselected items.
   */
  function toggle(id: string) {
    if (selected.includes(id)) {
      // Deselect
      onChange(selected.filter((s) => s !== id));
    } else {
      // Select — check cap
      if (maxSelections && selected.length >= maxSelections) return;
      onChange([...selected, id]);
    }
  }

  const atMax = maxSelections ? selected.length >= maxSelections : false;

  return (
    <div className="space-y-3">
      {/* Label + selection count */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/80">{label}</span>
        {maxSelections && (
          <span className="text-xs text-foreground/50">
            {selected.length}/{maxSelections} selected
          </span>
        )}
        {!maxSelections && selected.length > 0 && (
          <span className="text-xs text-foreground/50">{selected.length} selected</span>
        )}
      </div>

      {/* Chip list */}
      <div className="flex flex-wrap gap-2">
        {methodologies.map((m) => {
          const isSelected = selected.includes(m.id);
          const isDisabled = !isSelected && atMax;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className={[
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
                'border transition-all duration-150 select-none',
                isSelected
                  ? 'border-brand-600 bg-brand-600/15 text-brand-600'
                  : 'border-foreground/20 bg-transparent text-foreground/70 hover:border-foreground/40',
                isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {/* Methodology icon (emoji or letter abbreviation) */}
              {m.icon ? (
                <span className="text-base leading-none">{m.icon}</span>
              ) : (
                <span className="text-xs font-bold">{m.name.slice(0, 2).toUpperCase()}</span>
              )}
              <span>{m.name}</span>
              {isSelected && (
                <span className="ml-0.5 text-brand-600" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          );
        })}

        {methodologies.length === 0 && (
          <p className="text-sm text-foreground/50 italic">
            No methodologies enabled. Go to Strategies to add some.
          </p>
        )}
      </div>

      {/* Description tooltip for hovered methodology */}
      {hoveredMethodology && (
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm text-foreground/70">
          <span className="font-medium text-foreground">{hoveredMethodology.name}</span>
          {hoveredMethodology.tagline && (
            <span className="ml-2 text-foreground/60">— {hoveredMethodology.tagline}</span>
          )}
        </div>
      )}
    </div>
  );
}
