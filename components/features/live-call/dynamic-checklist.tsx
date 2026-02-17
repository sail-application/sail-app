'use client';

/**
 * components/features/live-call/dynamic-checklist.tsx
 *
 * Dynamic checklist panel for Live Call Assistant.
 * Checklist items auto-complete as they're detected in the transcript.
 * Completed items animate out (or dim) so the user can focus on what's left.
 *
 * The checklist is methodology-aware — items come from the active methodology's
 * stages or from a default "universal qualification" checklist.
 */

import { CheckCircle2, Circle } from 'lucide-react';

export interface ChecklistItem {
  key: string;
  label: string;
  description?: string;
}

interface DynamicChecklistProps {
  /** All checklist items (from methodology or default) */
  items: ChecklistItem[];
  /** Current state — keys that are true have been covered */
  state: Record<string, boolean>;
}

/** Default qualification checklist used when no methodology-specific items are available */
export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: 'intro', label: 'Introduction', description: 'Established who you are and your company' },
  { key: 'rapport', label: 'Rapport Built', description: 'Found common ground or personal connection' },
  { key: 'pain_points', label: 'Pain Points', description: 'Uncovered a problem or challenge they face' },
  { key: 'budget', label: 'Budget', description: 'Discussed their budget or investment range' },
  { key: 'timeline', label: 'Timeline', description: 'Established when they need a solution' },
  { key: 'decision_maker', label: 'Decision Maker', description: 'Identified who makes the final call' },
  { key: 'next_steps', label: 'Next Steps', description: 'Agreed on a clear next action' },
];

/**
 * DynamicChecklist — Auto-updating qualification tracker.
 * Items are checked off as the AI detects them in the transcript.
 * Unchecked items appear prominently; checked items fade and move to bottom.
 */
export function DynamicChecklist({ items, state }: DynamicChecklistProps) {
  const unchecked = items.filter((item) => !state[item.key]);
  const checked = items.filter((item) => state[item.key]);
  const completionPct = items.length > 0 ? Math.round((checked.length / items.length) * 100) : 0;

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Header + progress */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            Call Checklist
          </p>
          <span className="text-xs text-foreground/50">{completionPct}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-foreground/10">
          <div
            className="h-1 rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Unchecked items — prominently displayed */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {unchecked.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-2 rounded-lg border border-foreground/10 px-2.5 py-2"
          >
            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-foreground/30" />
            <div>
              <p className="text-sm font-medium text-foreground/80">{item.label}</p>
              {item.description && (
                <p className="text-xs text-foreground/50">{item.description}</p>
              )}
            </div>
          </div>
        ))}

        {/* Checked items — dimmed at bottom */}
        {checked.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-2 rounded-lg px-2.5 py-2 opacity-40 transition-opacity duration-500"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <p className="text-sm line-through text-foreground/60">{item.label}</p>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-foreground/40 italic">No checklist items configured.</p>
        )}
      </div>
    </div>
  );
}
