'use client';

/**
 * components/features/practice/practice-session.tsx
 *
 * UI orchestrator for Practice Mode.
 * Manages the phase (setup → active → summary) and delegates all session
 * logic (SSE streaming, API calls, state) to usePracticeSession hook.
 *
 * Three phases:
 *   setup   → SessionSetup form (choose methodology, scenario, context pack)
 *   active  → Split-screen: TranscriptView (left) + CoachingPanel (right)
 *   summary → SessionSummary scorecard after the session ends
 */

import { useState } from 'react';
import { Square } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { SessionSetup } from './session-setup';
import { TranscriptView } from './transcript-view';
import { CoachingPanel } from './coaching-panel';
import { SessionSummary } from './session-summary';
import { usePracticeSession } from '@/lib/hooks/use-practice-session';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

type Phase = 'setup' | 'active' | 'summary';

interface PracticeSessionProps {
  /** User's enabled methodologies (fetched server-side) */
  methodologies: MethodologyListItem[];
  /** Available industry context packs (fetched server-side) */
  contextPacks: ContextPackOption[];
}

/**
 * PracticeSession — top-level component for Practice Mode.
 * Owns the phase state; delegates all session logic to usePracticeSession.
 */
export function PracticeSession({ methodologies, contextPacks }: PracticeSessionProps) {
  const [phase, setPhase] = useState<Phase>('setup');

  const {
    sessionId,
    activeMethodologyIds,
    activeContextPackId,
    messages,
    isTyping,
    inputText,
    isSending,
    coachNotes,
    durationSeconds,
    summaryScore,
    summaryFeedback,
    setInputText,
    handleSessionStarted,
    handleSend,
    handleEndSession,
    handleRestart,
  } = usePracticeSession();

  /** Fired by SessionSetup; transitions to active and kicks off the AI opening */
  async function onSessionStarted(id: string, methodIds: string[], cpId: string | null) {
    setPhase('active');
    await handleSessionStarted(id, methodIds, cpId);
  }

  /** Ends the session, transitions to summary, and fetches AI feedback */
  async function onEndSession() {
    setPhase('summary');
    await handleEndSession(sessionId, messages, activeMethodologyIds, activeContextPackId);
  }

  /** Resets to setup phase */
  function onRestart() {
    handleRestart();
    setPhase('setup');
  }

  // Methodology names shown in the coaching panel header
  const activeMethodologyNames = methodologies
    .filter((m) => activeMethodologyIds.includes(m.id))
    .map((m) => m.name);

  /* ── Setup phase ── */
  if (phase === 'setup') {
    return (
      <GlassPanel className="max-w-2xl mx-auto p-6">
        <SessionSetup
          methodologies={methodologies}
          contextPacks={contextPacks}
          onSessionStarted={onSessionStarted}
        />
      </GlassPanel>
    );
  }

  /* ── Summary phase ── */
  if (phase === 'summary') {
    return (
      <GlassPanel className="max-w-2xl mx-auto p-6">
        <SessionSummary
          score={summaryScore}
          feedback={summaryFeedback}
          messageCount={messages.filter((m) => m.role === 'user').length}
          durationSeconds={durationSeconds}
          onRestart={onRestart}
        />
      </GlassPanel>
    );
  }

  /* ── Active session: split-screen layout ── */
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left panel: conversation transcript + input */}
      <GlassPanel className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-hidden">
          <TranscriptView messages={messages} isTyping={isTyping} />
        </div>

        {/* Message input */}
        <div className="border-t border-foreground/10 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(sessionId!, activeMethodologyIds, messages);
                }
              }}
              placeholder="Type your response..."
              disabled={isSending}
              className="flex-1 rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-600/50 disabled:opacity-50"
            />
            <Button
              onClick={() => handleSend(sessionId!, activeMethodologyIds, messages)}
              disabled={isSending || !inputText.trim()}
              size="sm"
            >
              Send
            </Button>
          </div>
        </div>
      </GlassPanel>

      {/* Right panel: coaching sidebar + end session */}
      <div className="flex w-72 flex-col gap-3">
        <GlassPanel className="flex-1 overflow-hidden p-0">
          <CoachingPanel notes={coachNotes} activeMethodologyNames={activeMethodologyNames} />
        </GlassPanel>

        <Button
          onClick={onEndSession}
          variant="outline"
          className="w-full gap-2 border-red-500/30 text-red-600 hover:bg-red-500/10"
        >
          <Square className="h-4 w-4" />
          End Session
        </Button>
      </div>
    </div>
  );
}
