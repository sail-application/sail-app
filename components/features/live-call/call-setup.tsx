'use client';

/**
 * components/features/live-call/call-setup.tsx
 *
 * Pre-call configuration screen for the Live Call Assistant.
 * User selects their active methodologies and optional context pack
 * before starting the call.
 *
 * On submit, calls POST /api/ai/live-call with action 'start'.
 */

import { useState } from 'react';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MethodologySelector } from '@/components/features/shared/methodology-selector';
import { ContextPackSelector } from '@/components/features/shared/context-pack-selector';
import { SessionConfigManager } from '@/components/features/shared/session-config-manager';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

interface CallSetupProps {
  methodologies: MethodologyListItem[];
  contextPacks: ContextPackOption[];
  onCallStarted: (sessionId: string, methodologyIds: string[], contextPackId: string | null) => void;
}

/**
 * CallSetup — Pre-call configuration panel.
 * Minimal setup: methodology selection + optional context pack.
 */
export function CallSetup({ methodologies, contextPacks, onCallStarted }: CallSetupProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    methodologies.length > 0 ? [methodologies[0].id] : [],
  );
  const [contextPackId, setContextPackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/live-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          methodologyIds: selectedIds,
          contextPackId: contextPackId ?? undefined,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? 'Failed to start session.');
      }

      const { sessionId } = await response.json();
      onCallStarted(sessionId, selectedIds, contextPackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
          <Phone className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Set Up Live Call Assistant</h3>
          <p className="text-sm text-foreground/60">Select your coaching frameworks, then start your call</p>
        </div>
      </div>

      <SessionConfigManager
        sessionType="live-call"
        currentMethodologyIds={selectedIds}
        currentContextPackId={contextPackId}
        onLoadConfig={(methodIds, cpId) => {
          setSelectedIds(methodIds);
          setContextPackId(cpId);
        }}
      />

      <MethodologySelector
        methodologies={methodologies}
        selected={selectedIds}
        onChange={setSelectedIds}
        maxSelections={3}
        label="Active Coaching Frameworks"
      />

      {contextPacks.length > 0 && (
        <ContextPackSelector
          packs={contextPacks}
          selectedId={contextPackId}
          onChange={setContextPackId}
        />
      )}

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
        <strong>Tip:</strong> Once started, the assistant will listen via your microphone and provide real-time coaching as the conversation unfolds.
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handleStart}
        disabled={selectedIds.length === 0 || loading}
        className="w-full gap-2"
      >
        <Phone className="h-4 w-4" />
        {loading ? 'Starting...' : 'Start Live Call Assistant'}
      </Button>
    </div>
  );
}
