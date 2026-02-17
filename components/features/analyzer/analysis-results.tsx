'use client';

/**
 * components/features/analyzer/analysis-results.tsx
 *
 * Displays the structured AI scorecard returned by /api/ai/analyze.
 * Shows: overall score, per-dimension bars, strengths, weaknesses, action items.
 */

import { Trophy, RotateCcw, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Scorecard {
  overall_score?: number;
  dimensions?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  action_items?: string[];
  raw?: string;
}

interface AnalysisResultsProps {
  scorecard: Scorecard;
  methodologyNames: string[];
  onReset: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

export function AnalysisResults({ scorecard, methodologyNames, onReset }: AnalysisResultsProps) {
  function handleCopy() {
    const text = [
      scorecard.overall_score !== undefined ? `Overall Score: ${scorecard.overall_score}/100` : '',
      scorecard.strengths?.length ? `\nStrengths:\n${scorecard.strengths.map((s) => `• ${s}`).join('\n')}` : '',
      scorecard.weaknesses?.length ? `\nWeaknesses:\n${scorecard.weaknesses.map((s) => `• ${s}`).join('\n')}` : '',
      scorecard.action_items?.length ? `\nAction Items:\n${scorecard.action_items.map((s) => `• ${s}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');
    void navigator.clipboard.writeText(text);
  }

  // Fallback: if only raw content was returned
  if (scorecard.raw) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4 text-sm whitespace-pre-wrap font-mono">
          {scorecard.raw}
        </div>
        <Button onClick={onReset} variant="outline" className="w-full gap-2">
          <RotateCcw className="h-4 w-4" />
          Analyze Another
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Analysis Complete</h3>
            <p className="text-sm text-foreground/60">{methodologyNames.join(', ')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
      </div>

      {/* Overall score */}
      {scorecard.overall_score !== undefined && (
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-center">
          <p className="mb-1 text-sm text-foreground/60">Overall Score</p>
          <p className={`text-4xl font-bold ${scoreColor(scorecard.overall_score)}`}>
            {scorecard.overall_score}
            <span className="text-lg text-foreground/40">/100</span>
          </p>

          {/* Per-dimension bars */}
          {scorecard.dimensions && Object.keys(scorecard.dimensions).length > 0 && (
            <div className="mt-4 space-y-2 text-left">
              {Object.entries(scorecard.dimensions).map(([dim, val]) => (
                <div key={dim} className="flex items-center gap-2">
                  <span className="w-32 truncate text-xs capitalize text-foreground/60">{dim.replace(/_/g, ' ')}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-foreground/10">
                    <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${(val / 10) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strengths */}
      {scorecard.strengths && scorecard.strengths.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-green-600">Strengths</p>
          <ul className="space-y-1">
            {scorecard.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="mt-0.5 shrink-0 text-green-500">✓</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {scorecard.weaknesses && scorecard.weaknesses.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600">Areas to Improve</p>
          <ul className="space-y-1">
            {scorecard.weaknesses.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="mt-0.5 shrink-0 text-amber-500">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action items */}
      {scorecard.action_items && scorecard.action_items.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">Action Items</p>
          <ul className="space-y-1">
            {scorecard.action_items.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="mt-0.5 shrink-0 text-blue-500">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onReset} variant="outline" className="flex-1 gap-2">
          <RotateCcw className="h-4 w-4" />
          Analyze Another
        </Button>
      </div>
    </div>
  );
}
