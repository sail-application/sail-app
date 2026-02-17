'use client';

/**
 * components/features/live-call/call-cockpit.tsx
 *
 * Main 3-panel Live Call Assistant client component.
 * Manages the full call lifecycle:
 *   1. Setup (CallSetup) — select methodologies before starting
 *   2. Active (3-panel cockpit) — transcript | coaching feed | checklist
 *   3. Summary (PostCallSummary) — debrief after ending the call
 *
 * Coaching trigger: every 20 new words of transcript → fire coaching request.
 * Checklist trigger: every 40 new words → update checklist via /checklist API.
 */

import { useState, useCallback, useRef } from 'react';
import { Square } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { CallSetup } from './call-setup';
import { TranscriptStream } from './transcript-stream';
import { CoachingFeed, type CoachingEvent } from './coaching-feed';
import { DynamicChecklist, DEFAULT_CHECKLIST_ITEMS, type ChecklistItem } from './dynamic-checklist';
import { PostCallSummary } from './post-call-summary';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

type Phase = 'setup' | 'active' | 'summary';

interface CallCockpitProps {
  methodologies: MethodologyListItem[];
  contextPacks: ContextPackOption[];
}

/** How many new words trigger a coaching suggestion */
const COACHING_WORD_THRESHOLD = 20;
/** How many new words trigger a checklist update */
const CHECKLIST_WORD_THRESHOLD = 40;

/**
 * CallCockpit — Top-level stateful component for the Live Call Assistant.
 * Orchestrates setup → active → summary transitions.
 */
export function CallCockpit({ methodologies, contextPacks }: CallCockpitProps) {
  const [phase, setPhase] = useState<Phase>('setup');

  // Session data — stored in both state (for renders) and refs (for stable callbacks)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeMethodologyIds, setActiveMethodologyIds] = useState<string[]>([]);
  // Refs give fetchCoachingSuggestion/updateChecklist always-current values
  // without requiring them to be in useCallback deps (which would cause thrashing)
  const sessionIdRef = useRef<string | null>(null);
  const contextPackIdRef = useRef<string | null>(null);
  const methodologyIdsRef = useRef<string[]>([]);

  // Transcript (accumulated by TranscriptStream via onTranscriptUpdate)
  const [transcript, setTranscript] = useState('');
  const lastCoachWordCount = useRef(0);
  const lastChecklistWordCount = useRef(0);

  // Coaching events
  const [coachingEvents, setCoachingEvents] = useState<CoachingEvent[]>([]);
  const [isCoaching, setIsCoaching] = useState(false);

  // Checklist
  const checklistItems: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS;
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  // Session timing
  const sessionStartRef = useRef<Date | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  /** Called by CallSetup when a session is created */
  function handleCallStarted(sid: string, methodIds: string[], cpId: string | null) {
    setSessionId(sid);
    setActiveMethodologyIds(methodIds);
    // Keep refs in sync so stable callbacks always see the latest values
    sessionIdRef.current = sid;
    methodologyIdsRef.current = methodIds;
    contextPackIdRef.current = cpId;
    sessionStartRef.current = new Date();
    setPhase('active');
  }

  /**
   * Called by TranscriptStream whenever new speech is captured.
   * Triggers coaching and checklist updates when thresholds are crossed.
   */
  const handleTranscriptUpdate = useCallback(
    (fullTranscript: string) => {
      setTranscript(fullTranscript);

      const wordCount = fullTranscript.trim().split(/\s+/).filter(Boolean).length;

      // Trigger coaching suggestion
      if (wordCount - lastCoachWordCount.current >= COACHING_WORD_THRESHOLD && !isCoaching) {
        lastCoachWordCount.current = wordCount;
        void fetchCoachingSuggestion(fullTranscript);
      }

      // Trigger checklist update
      if (wordCount - lastChecklistWordCount.current >= CHECKLIST_WORD_THRESHOLD) {
        lastChecklistWordCount.current = wordCount;
        void updateChecklist(fullTranscript);
      }
    },
    [isCoaching], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Fetches a streaming coaching suggestion from /api/ai/live-call.
   * Streams the response into a new CoachingEvent entry.
   * Uses sessionIdRef / methodologyIdsRef so this is never stale inside callbacks.
   */
  async function fetchCoachingSuggestion(currentTranscript: string) {
    if (!sessionIdRef.current) return;
    setIsCoaching(true);

    // Create a placeholder event that will be filled as the stream arrives
    const eventId = crypto.randomUUID();
    const placeholderEvent: CoachingEvent = {
      id: eventId,
      timestamp: new Date(),
      content: '',
      isStreaming: true,
    };
    setCoachingEvents((prev) => [placeholderEvent, ...prev]);

    try {
      const response = await fetch('/api/ai/live-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'coach',
          sessionId: sessionIdRef.current,
          transcript: currentTranscript,
          methodologyIds: methodologyIdsRef.current,
          contextPackId: contextPackIdRef.current ?? undefined,
        }),
      });

      if (!response.ok || !response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const raw = line.slice(6);
          if (raw === '[DONE]') break;
          try {
            const chunk = JSON.parse(raw) as string;
            content += chunk;
            setCoachingEvents((prev) =>
              prev.map((e) => (e.id === eventId ? { ...e, content, isStreaming: true } : e)),
            );
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }

      // Mark streaming complete
      setCoachingEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, content, isStreaming: false } : e)),
      );
    } catch {
      // Remove placeholder on error
      setCoachingEvents((prev) => prev.filter((e) => e.id !== eventId));
    } finally {
      setIsCoaching(false);
    }
  }

  /** Calls the checklist API to auto-check covered items */
  async function updateChecklist(currentTranscript: string) {
    if (!sessionIdRef.current) return;

    try {
      const response = await fetch('/api/ai/live-call/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          transcript: currentTranscript,
          checklistItems: checklistItems.map((i) => i.key),
          currentState: checklistState,
        }),
      });

      if (response.ok) {
        const { checklistState: updated } = await response.json();
        setChecklistState(updated);
      }
    } catch {
      // Non-fatal — checklist updates are best-effort
    }
  }

  /** Ends the call, calculates duration, moves to summary */
  async function handleEndCall() {
    const elapsed = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
      : 0;
    setDurationSeconds(elapsed);

    if (sessionId) {
      // Fire-and-forget — don't block the UI transition
      void fetch('/api/ai/live-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionId,
          durationSeconds: elapsed,
          transcript,
          coachingEvents: coachingEvents.map((e) => ({
            id: e.id,
            timestamp: e.timestamp.toISOString(),
            content: e.content,
          })),
          checklistState,
        }),
      });
    }

    setPhase('summary');
  }

  /** Resets everything back to setup */
  function handleRestart() {
    setPhase('setup');
    setSessionId(null);
    setTranscript('');
    setCoachingEvents([]);
    setChecklistState({});
    setActiveMethodologyIds([]);
    lastCoachWordCount.current = 0;
    lastChecklistWordCount.current = 0;
    sessionStartRef.current = null;
    sessionIdRef.current = null;
    methodologyIdsRef.current = [];
    contextPackIdRef.current = null;
  }

  /* ── Render ── */

  if (phase === 'setup') {
    return (
      <GlassPanel className="max-w-2xl mx-auto p-6">
        <CallSetup methodologies={methodologies} contextPacks={contextPacks} onCallStarted={handleCallStarted} />
      </GlassPanel>
    );
  }

  if (phase === 'summary') {
    return (
      <GlassPanel className="max-w-2xl mx-auto p-6">
        <PostCallSummary
          durationSeconds={durationSeconds}
          checklistItems={checklistItems}
          checklistState={checklistState}
          coachingEvents={coachingEvents}
          transcript={transcript}
          onRestart={handleRestart}
        />
      </GlassPanel>
    );
  }

  // Resolve methodology names for the active-call header
  const activeMethodologyNames = methodologies
    .filter((m) => activeMethodologyIds.includes(m.id))
    .map((m) => m.name);

  // Active call: 3-panel cockpit
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
      {/* Active methodology chips — quick reference during the call */}
      {activeMethodologyNames.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/50">Active frameworks:</span>
          {activeMethodologyNames.map((name) => (
            <span
              key={name}
              className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2 py-0.5 text-xs font-medium text-brand-600"
            >
              {name}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-1 gap-4">
      {/* Panel 1: Live Transcript */}
      <GlassPanel className="flex flex-1 flex-col overflow-hidden p-0">
        <TranscriptStream onTranscriptUpdate={handleTranscriptUpdate} />
      </GlassPanel>

      {/* Panel 2: AI Coaching Feed */}
      <GlassPanel className="flex w-72 flex-col overflow-hidden p-0">
        <CoachingFeed events={coachingEvents} />
      </GlassPanel>

      {/* Panel 3: Checklist + End Call */}
      <div className="flex w-60 flex-col gap-3">
        <GlassPanel className="flex-1 overflow-hidden p-0">
          <DynamicChecklist items={checklistItems} state={checklistState} />
        </GlassPanel>

        <Button
          onClick={handleEndCall}
          variant="outline"
          className="w-full gap-2 border-red-500/30 text-red-600 hover:bg-red-500/10"
        >
          <Square className="h-4 w-4" />
          End Call
        </Button>
      </div>
      </div>
    </div>
  );
}
