'use client';

/**
 * components/features/analyzer/analyzer-setup.tsx
 *
 * Setup form for the Call Analyzer feature.
 * User selects frameworks, optional context pack, and pastes the call transcript.
 */

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MethodologySelector } from '@/components/features/shared/methodology-selector';
import { ContextPackSelector } from '@/components/features/shared/context-pack-selector';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

interface AnalyzerSetupProps {
  methodologies: MethodologyListItem[];
  contextPacks: ContextPackOption[];
  onAnalyze: (transcript: string, methodologyIds: string[], contextPackId: string | null) => void;
  isLoading: boolean;
}

export function AnalyzerSetup({ methodologies, contextPacks, onAnalyze, isLoading }: AnalyzerSetupProps) {
  const [transcript, setTranscript] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    methodologies.length > 0 ? [methodologies[0].id] : [],
  );
  const [contextPackId, setContextPackId] = useState<string | null>(null);

  function handleSubmit() {
    if (!transcript.trim()) return;
    onAnalyze(transcript.trim(), selectedIds, contextPackId);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Analyze a Call</h3>
          <p className="text-sm text-foreground/60">Paste your transcript for an AI scorecard</p>
        </div>
      </div>

      <MethodologySelector
        methodologies={methodologies}
        selected={selectedIds}
        onChange={setSelectedIds}
        maxSelections={3}
        label="Coaching Frameworks (select up to 3)"
      />

      {contextPacks.length > 0 && (
        <ContextPackSelector
          packs={contextPacks}
          selectedId={contextPackId}
          onChange={setContextPackId}
        />
      )}

      <div className="space-y-2">
        <label htmlFor="transcript" className="text-sm font-medium text-foreground/80">
          Call Transcript
        </label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your call transcript here. Format: 'Rep: ...\nProspect: ...' or plain text."
          rows={12}
          className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-600/50 resize-none font-mono"
        />
        <p className="text-right text-xs text-foreground/40">{transcript.length} chars</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!transcript.trim() || isLoading}
        className="w-full gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        {isLoading ? 'Analyzing...' : 'Analyze Call'}
      </Button>
    </div>
  );
}
