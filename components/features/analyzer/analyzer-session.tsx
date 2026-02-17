'use client';

/**
 * components/features/analyzer/analyzer-session.tsx
 *
 * Orchestrates the Call Analyzer feature lifecycle:
 *   setup → analyzing → results
 *
 * Calls POST /api/ai/analyze and renders the scorecard.
 */

import { useState } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { AnalyzerSetup } from './analyzer-setup';
import { AnalysisResults } from './analysis-results';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

type Phase = 'setup' | 'results';

interface Scorecard {
  overall_score?: number;
  dimensions?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  action_items?: string[];
  raw?: string;
}

interface AnalyzerSessionProps {
  methodologies: MethodologyListItem[];
  contextPacks: ContextPackOption[];
}

export function AnalyzerSession({ methodologies, contextPacks }: AnalyzerSessionProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [activeMethodologyNames, setActiveMethodologyNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(
    transcript: string,
    methodologyIds: string[],
    contextPackId: string | null,
  ) {
    setIsLoading(true);
    setError(null);

    // Capture methodology names for the results header
    const names = methodologies
      .filter((m) => methodologyIds.includes(m.id))
      .map((m) => m.name);
    setActiveMethodologyNames(names.length > 0 ? names : ['General Coaching']);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          methodologyIds,
          contextPackId: contextPackId ?? undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Analysis failed.');
      }

      const { scorecard: data } = await res.json();
      setScorecard(data);
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setPhase('setup');
    setScorecard(null);
    setError(null);
  }

  return (
    <GlassPanel className="p-6">
      {phase === 'setup' && (
        <>
          <AnalyzerSetup
            methodologies={methodologies}
            contextPacks={contextPacks}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          {error && (
            <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </>
      )}
      {phase === 'results' && scorecard && (
        <AnalysisResults
          scorecard={scorecard}
          methodologyNames={activeMethodologyNames}
          onReset={handleReset}
        />
      )}
    </GlassPanel>
  );
}
