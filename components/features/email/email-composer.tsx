'use client';

/**
 * components/features/email/email-composer.tsx
 *
 * Orchestrates the Email Composition feature:
 *   setup → drafting (loading) → editing
 *
 * Calls POST /api/ai/email for both draft and refine actions.
 */

import { useState } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { EmailSetup } from './email-setup';
import { EmailEditor } from './email-editor';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

type Phase = 'setup' | 'editing';
type Tone = 'formal' | 'casual' | 'assertive';

interface EmailComposerProps {
  methodologies: MethodologyListItem[];
  contextPacks: ContextPackOption[];
}

export function EmailComposer({ methodologies, contextPacks }: EmailComposerProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [draft, setDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [activeMethodologyNames, setActiveMethodologyNames] = useState<string[]>([]);
  const [activeMethodologyIds, setActiveMethodologyIds] = useState<string[]>([]);
  const [activeContextPackId, setActiveContextPackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDraft(
    recipientContext: string,
    objective: string,
    tone: Tone,
    methodologyIds: string[],
    contextPackId: string | null,
  ) {
    setIsDrafting(true);
    setError(null);

    // Store active config for potential refinements
    setActiveMethodologyIds(methodologyIds);
    setActiveContextPackId(contextPackId);
    setActiveMethodologyNames(
      methodologies.filter((m) => methodologyIds.includes(m.id)).map((m) => m.name),
    );

    try {
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          recipientContext,
          objective,
          tone,
          methodologyIds,
          contextPackId: contextPackId ?? undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to generate draft.');
      }

      const { draft: generatedDraft } = await res.json();
      setDraft(generatedDraft);
      setPhase('editing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleRefine(currentDraft: string, feedback: string) {
    setIsRefining(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine',
          currentDraft,
          feedback,
          methodologyIds: activeMethodologyIds,
          contextPackId: activeContextPackId ?? undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to refine draft.');
      }

      const { draft: refinedDraft } = await res.json();
      setDraft(refinedDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsRefining(false);
    }
  }

  function handleNew() {
    setPhase('setup');
    setDraft('');
    setError(null);
  }

  return (
    <GlassPanel className="p-6">
      {phase === 'setup' && (
        <>
          <EmailSetup
            methodologies={methodologies}
            contextPacks={contextPacks}
            onDraft={handleDraft}
            isLoading={isDrafting}
          />
          {error && (
            <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </>
      )}

      {phase === 'editing' && (
        <>
          <EmailEditor
            draft={draft}
            methodologyNames={activeMethodologyNames}
            onRefine={handleRefine}
            onNew={handleNew}
            isRefining={isRefining}
          />
          {error && (
            <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </>
      )}
    </GlassPanel>
  );
}
