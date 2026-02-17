'use client';

/**
 * components/features/live-call/post-call-summary.tsx
 *
 * Post-call summary shown after a Live Call session ends.
 * Displays the transcript, checklist completion, coaching events,
 * and an export-ready summary for notes or CRM entry.
 */

import { ClipboardList, Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CoachingEvent } from './coaching-feed';
import type { ChecklistItem } from './dynamic-checklist';

interface PostCallSummaryProps {
  /** Duration of the call in seconds */
  durationSeconds: number;
  /** Final checklist state */
  checklistItems: ChecklistItem[];
  checklistState: Record<string, boolean>;
  /** All coaching events from the session */
  coachingEvents: CoachingEvent[];
  /** Full transcript text */
  transcript: string;
  /** Called to start a new call */
  onRestart: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * PostCallSummary — Export-ready call debrief.
 * Shows what was covered, AI coaching highlights, and full transcript.
 */
export function PostCallSummary({
  durationSeconds,
  checklistItems,
  checklistState,
  coachingEvents,
  transcript,
  onRestart,
}: PostCallSummaryProps) {
  const checked = checklistItems.filter((i) => checklistState[i.key]);
  const completionPct =
    checklistItems.length > 0
      ? Math.round((checked.length / checklistItems.length) * 100)
      : 0;

  /** Copies the summary to clipboard for pasting into CRM notes */
  function handleExport() {
    const lines = [
      `SAIL Live Call Summary — ${new Date().toLocaleDateString()}`,
      `Duration: ${formatDuration(durationSeconds)}`,
      `Checklist: ${checked.length}/${checklistItems.length} items covered (${completionPct}%)`,
      '',
      '=== COVERED ===',
      ...checked.map((i) => `✓ ${i.label}`),
      '',
      '=== COACHING HIGHLIGHTS ===',
      ...coachingEvents.slice(0, 5).map((e) => `• ${e.content}`),
      '',
      '=== TRANSCRIPT ===',
      transcript,
    ];
    void navigator.clipboard.writeText(lines.join('\n'));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Call Complete</h3>
          <p className="text-sm text-foreground/60">Here&apos;s your session summary</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-center">
          <Clock className="mx-auto mb-1 h-4 w-4 text-foreground/50" />
          <p className="text-lg font-bold">{formatDuration(durationSeconds)}</p>
          <p className="text-xs text-foreground/50">Duration</p>
        </div>
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-foreground/50" />
          <p className="text-lg font-bold">{completionPct}%</p>
          <p className="text-xs text-foreground/50">Checklist Done</p>
        </div>
      </div>

      {/* Checklist results */}
      {checklistItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            What Was Covered
          </p>
          <div className="space-y-1">
            {checklistItems.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                {checklistState[item.key] ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-foreground/30 shrink-0" />
                )}
                <span className={checklistState[item.key] ? 'text-foreground/80' : 'text-foreground/40'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaching highlights */}
      {coachingEvents.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Coaching Highlights
          </p>
          <ul className="space-y-1">
            {coachingEvents.slice(0, 4).map((event) => (
              <li key={event.id} className="flex gap-2 text-sm text-foreground/70">
                <span className="shrink-0 text-brand-600">→</span>
                {event.content}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={handleExport} variant="outline" className="flex-1 text-sm">
          Copy Summary
        </Button>
        <Button onClick={onRestart} className="flex-1 gap-2 text-sm">
          <RotateCcw className="h-4 w-4" />
          New Call
        </Button>
      </div>
    </div>
  );
}
