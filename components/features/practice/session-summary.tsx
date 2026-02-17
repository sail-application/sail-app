'use client';

/**
 * components/features/practice/session-summary.tsx
 *
 * Post-session scorecard shown when a practice session is completed.
 * Displays the overall score, per-dimension breakdown (if available),
 * and the AI-generated feedback (strengths + areas for improvement).
 *
 * Also shows session stats: duration and number of messages exchanged.
 */

import { Trophy, Clock, MessageSquare, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionScore {
  overall: number;
  dimensions?: Record<string, number>;
}

interface SessionSummaryProps {
  /** Overall score and optional per-dimension breakdown */
  score: SessionScore | null;
  /** AI-generated session feedback */
  feedback: {
    strengths?: string[];
    improvements?: string[];
    tips?: string[];
  } | null;
  /** How many messages were exchanged */
  messageCount: number;
  /** Session duration in seconds */
  durationSeconds: number;
  /** Called when user wants to start a new session */
  onRestart: () => void;
}

/** Formats seconds into a human-readable "Xm Ys" string */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Color class based on score value */
function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

/**
 * SessionSummary — Post-session scorecard and feedback panel.
 * Shows after the user ends the practice session.
 */
export function SessionSummary({
  score,
  feedback,
  messageCount,
  durationSeconds,
  onRestart,
}: SessionSummaryProps) {
  const isLoading = score === null && feedback === null;

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Session Complete</h3>
          <p className="text-sm text-foreground/60">
            {isLoading ? 'Generating your scorecard...' : "Here\u0027s how you did"}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-foreground/50">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm">Analyzing your conversation...</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-center">
          <Clock className="mx-auto mb-1 h-4 w-4 text-foreground/50" />
          <p className="text-lg font-bold">{formatDuration(durationSeconds)}</p>
          <p className="text-xs text-foreground/50">Duration</p>
        </div>
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-center">
          <MessageSquare className="mx-auto mb-1 h-4 w-4 text-foreground/50" />
          <p className="text-lg font-bold">{messageCount}</p>
          <p className="text-xs text-foreground/50">Exchanges</p>
        </div>
      </div>

      {/* Overall score */}
      {score && (
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-center">
          <p className="mb-1 text-sm text-foreground/60">Overall Score</p>
          <p className={`text-4xl font-bold ${scoreColor(score.overall)}`}>
            {score.overall}
            <span className="text-lg text-foreground/40">/100</span>
          </p>

          {/* Per-dimension breakdown */}
          {score.dimensions && Object.keys(score.dimensions).length > 0 && (
            <div className="mt-4 space-y-2 text-left">
              {Object.entries(score.dimensions).map(([dim, val]) => (
                <div key={dim} className="flex items-center gap-2">
                  <span className="w-28 truncate text-xs capitalize text-foreground/60">{dim}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-foreground/10">
                    <div
                      className="h-1.5 rounded-full bg-brand-600"
                      style={{ width: `${(val / 10) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback sections */}
      {feedback && (
        <div className="space-y-3">
          {feedback.strengths && feedback.strengths.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-green-600">
                What You Did Well
              </p>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/80">
                    <span className="mt-0.5 shrink-0 text-green-500">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.improvements && feedback.improvements.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600">
                Areas to Improve
              </p>
              <ul className="space-y-1">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/80">
                    <span className="mt-0.5 shrink-0 text-amber-500">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.tips && feedback.tips.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
                Next Time, Try
              </p>
              <ul className="space-y-1">
                {feedback.tips.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/80">
                    <span className="mt-0.5 shrink-0 text-blue-500">💡</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Restart button */}
      <Button onClick={onRestart} variant="outline" className="w-full gap-2">
        <RotateCcw className="h-4 w-4" />
        Start Another Session
      </Button>
    </div>
  );
}
