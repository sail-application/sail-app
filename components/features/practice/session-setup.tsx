'use client';

/**
 * components/features/practice/session-setup.tsx
 *
 * Pre-session configuration panel for Practice Mode.
 * The user selects their active methodologies, an optional context pack,
 * and optionally describes the scenario.
 *
 * On submit, calls POST /api/ai/practice with action 'start' to create
 * a new session row, then triggers onSessionStarted() with the returned ID.
 */

import { useState } from 'react';
import { GraduationCap, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MethodologySelector } from '@/components/features/shared/methodology-selector';
import { ContextPackSelector } from '@/components/features/shared/context-pack-selector';
import { SessionConfigManager } from '@/components/features/shared/session-config-manager';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

interface SessionSetupProps {
  /** User's enabled methodologies to display in the selector */
  methodologies: MethodologyListItem[];
  /** Available industry context packs */
  contextPacks: ContextPackOption[];
  /** Called when a session has been created successfully */
  onSessionStarted: (sessionId: string, methodologyIds: string[], contextPackId: string | null) => void;
}

/**
 * SessionSetup — Configuration screen shown before a practice session begins.
 * Collects: which methodologies to use + optional context pack + scenario description.
 */
export function SessionSetup({ methodologies, contextPacks, onSessionStarted }: SessionSetupProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    methodologies.length > 0 ? [methodologies[0].id] : [],
  );
  const [contextPackId, setContextPackId] = useState<string | null>(null);
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          methodologyIds: selectedIds,
          contextPackId: contextPackId ?? undefined,
          scenarioDescription: scenario.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? 'Failed to start session.');
      }

      const { sessionId } = await response.json();
      onSessionStarted(sessionId, selectedIds, contextPackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Set Up Practice Session</h3>
          <p className="text-sm text-foreground/60">Choose your coaching frameworks and scenario</p>
        </div>
      </div>

      {/* Saved Configurations */}
      <SessionConfigManager
        sessionType="practice"
        currentMethodologyIds={selectedIds}
        currentContextPackId={contextPackId}
        onLoadConfig={(methodIds, cpId) => {
          setSelectedIds(methodIds);
          setContextPackId(cpId);
        }}
      />

      {/* Methodology Selector */}
      <MethodologySelector
        methodologies={methodologies}
        selected={selectedIds}
        onChange={setSelectedIds}
        maxSelections={3}
        label="Coaching Frameworks (select up to 3)"
      />

      {/* Context Pack Selector */}
      {contextPacks.length > 0 && (
        <ContextPackSelector
          packs={contextPacks}
          selectedId={contextPackId}
          onChange={setContextPackId}
        />
      )}

      {/* Scenario Description */}
      <div className="space-y-2">
        <label htmlFor="scenario" className="text-sm font-medium text-foreground/80">
          Scenario (optional)
        </label>
        <textarea
          id="scenario"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder="Describe who you're practicing with and what you're trying to accomplish. E.g., 'I'm cold-calling a dance studio owner who's never heard of us. My goal is to book a discovery call.'"
          rows={4}
          maxLength={500}
          className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-600/50 resize-none"
        />
        <p className="text-right text-xs text-foreground/40">{scenario.length}/500</p>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Start button */}
      <Button
        onClick={handleStart}
        disabled={selectedIds.length === 0 || loading}
        className="w-full gap-2"
      >
        <Play className="h-4 w-4" />
        {loading ? 'Starting session...' : 'Start Practice'}
      </Button>
    </div>
  );
}
