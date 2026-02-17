'use client';

/**
 * components/features/email/email-editor.tsx
 *
 * Editable email draft with refine capability.
 * User can edit the draft directly, request AI refinements, or copy to clipboard.
 */

import { useState } from 'react';
import { Copy, RefreshCw, Mail, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailEditorProps {
  draft: string;
  methodologyNames: string[];
  onRefine: (currentDraft: string, feedback: string) => void;
  onNew: () => void;
  isRefining: boolean;
}

export function EmailEditor({ draft, methodologyNames, onRefine, onNew, isRefining }: EmailEditorProps) {
  const [editedDraft, setEditedDraft] = useState(draft);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRefineForm, setShowRefineForm] = useState(false);

  // Keep local state in sync if a new draft comes in from refinement
  if (draft !== editedDraft && !isRefining) {
    setEditedDraft(draft);
  }

  function handleCopy() {
    void navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRefine() {
    if (!feedback.trim()) return;
    onRefine(editedDraft, feedback.trim());
    setFeedback('');
    setShowRefineForm(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Active methodology badges */}
      {methodologyNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {methodologyNames.map((name) => (
            <span
              key={name}
              className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2 py-0.5 text-xs font-medium text-brand-600"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Editable draft */}
      <textarea
        value={editedDraft}
        onChange={(e) => setEditedDraft(e.target.value)}
        rows={20}
        className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/50 resize-none font-mono"
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCopy} variant="outline" className="gap-2 flex-1">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
        <Button
          onClick={() => setShowRefineForm((v) => !v)}
          variant="outline"
          className="gap-2"
          disabled={isRefining}
        >
          <RefreshCw className={`h-4 w-4 ${isRefining ? 'animate-spin' : ''}`} />
          {isRefining ? 'Refining...' : 'Refine'}
        </Button>
        <Button onClick={onNew} variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          New Email
        </Button>
      </div>

      {/* Refine form */}
      {showRefineForm && (
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What should change? E.g., 'Make it shorter', 'Add urgency', 'Use a different hook'"
            rows={2}
            maxLength={500}
            className="w-full rounded border border-foreground/20 bg-transparent px-2 py-1 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand-600/50 resize-none"
          />
          <Button
            onClick={handleRefine}
            disabled={!feedback.trim() || isRefining}
            size="sm"
            className="w-full"
          >
            Apply Feedback
          </Button>
        </div>
      )}
    </div>
  );
}
