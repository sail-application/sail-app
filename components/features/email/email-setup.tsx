'use client';

/**
 * components/features/email/email-setup.tsx
 *
 * Setup form for the Email Composition feature.
 * Collects: recipient context, objective, tone, methodology, context pack.
 */

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MethodologySelector } from '@/components/features/shared/methodology-selector';
import { ContextPackSelector } from '@/components/features/shared/context-pack-selector';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

type Tone = 'formal' | 'casual' | 'assertive';

interface EmailSetupProps {
  methodologies: MethodologyListItem[];
  contextPacks: ContextPackOption[];
  onDraft: (recipientContext: string, objective: string, tone: Tone, methodologyIds: string[], contextPackId: string | null) => void;
  isLoading: boolean;
}

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Professional, polished' },
  { value: 'casual', label: 'Casual', description: 'Warm, conversational' },
  { value: 'assertive', label: 'Assertive', description: 'Confident, direct' },
];

export function EmailSetup({ methodologies, contextPacks, onDraft, isLoading }: EmailSetupProps) {
  const [recipientContext, setRecipientContext] = useState('');
  const [objective, setObjective] = useState('');
  const [tone, setTone] = useState<Tone>('formal');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    methodologies.length > 0 ? [methodologies[0].id] : [],
  );
  const [contextPackId, setContextPackId] = useState<string | null>(null);

  function handleSubmit() {
    if (!recipientContext.trim() || !objective.trim()) return;
    onDraft(recipientContext.trim(), objective.trim(), tone, selectedIds, contextPackId);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Compose Outreach Email</h3>
          <p className="text-sm text-foreground/60">AI-drafted and methodology-aligned</p>
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
        <label htmlFor="recipient" className="text-sm font-medium text-foreground/80">
          Who is this email to?
        </label>
        <textarea
          id="recipient"
          value={recipientContext}
          onChange={(e) => setRecipientContext(e.target.value)}
          placeholder="E.g., 'Sarah, owner of Sunset Dance Studio in San Antonio. Active on Instagram, hosts recitals in June and December. Never worked with a professional photographer.'"
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-600/50 resize-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="objective" className="text-sm font-medium text-foreground/80">
          What&apos;s the goal of this email?
        </label>
        <textarea
          id="objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="E.g., 'Book a 15-minute discovery call to discuss picture day photography for her June recital.'"
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-600/50 resize-none"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground/80">Tone</span>
        <div className="grid grid-cols-3 gap-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              className={[
                'rounded-lg border p-2.5 text-left transition-all cursor-pointer',
                tone === t.value
                  ? 'border-brand-600 bg-brand-600/10'
                  : 'border-foreground/20 hover:border-foreground/40',
              ].join(' ')}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-foreground/50">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!recipientContext.trim() || !objective.trim() || isLoading}
        className="w-full gap-2"
      >
        <Mail className="h-4 w-4" />
        {isLoading ? 'Drafting...' : 'Generate Draft'}
      </Button>
    </div>
  );
}
