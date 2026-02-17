'use client';

/**
 * components/features/practice/practice-session.tsx
 *
 * Main client component for Practice Mode.
 * Manages the full session lifecycle:
 *   1. Setup (SessionSetup) — choose methodologies + scenario
 *   2. Active (split-screen: TranscriptView + CoachingPanel)
 *   3. Summary (SessionSummary) — scorecard after session ends
 *
 * Handles SSE streaming from POST /api/ai/practice (action: 'message').
 * Text is streamed token-by-token into the transcript in real time.
 */

import { useState, useCallback, useRef } from 'react';
import { Square } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { SessionSetup } from './session-setup';
import { TranscriptView, type TranscriptMessage } from './transcript-view';
import { CoachingPanel, type CoachNote } from './coaching-panel';
import { SessionSummary } from './session-summary';
import type { MethodologyListItem } from '@/types/methodology';
import type { ContextPackOption } from '@/components/features/shared/context-pack-selector';

/** Session lifecycle phases */
type Phase = 'setup' | 'active' | 'summary';

interface PracticeSessionProps {
  /** User's enabled methodologies (fetched server-side) */
  methodologies: MethodologyListItem[];
  /** Available industry context packs (fetched server-side) */
  contextPacks: ContextPackOption[];
}

/**
 * PracticeSession — Top-level stateful component for the Practice Mode feature.
 * Orchestrates setup → active session → summary flow.
 */
export function PracticeSession({ methodologies, contextPacks }: PracticeSessionProps) {
  const [phase, setPhase] = useState<Phase>('setup');

  // Session data
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeMethodologyIds, setActiveMethodologyIds] = useState<string[]>([]);
  const [activeContextPackId, setActiveContextPackId] = useState<string | null>(null);
  const contextPackIdRef = useRef<string | null>(null);

  // Transcript state
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Coaching notes from the AI coach
  const [coachNotes, setCoachNotes] = useState<CoachNote[]>([]);

  // Session timing
  const sessionStartRef = useRef<Date | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Summary state (set when session ends)
  const [summaryScore, setSummaryScore] = useState<{ overall: number; dimensions?: Record<string, number> } | null>(null);
  const [summaryFeedback, setSummaryFeedback] = useState<{
    strengths?: string[];
    improvements?: string[];
    tips?: string[];
  } | null>(null);

  /**
   * Called by SessionSetup when a new session has been created.
   * Fires an invisible system kick-off prompt so the AI opens the roleplay
   * without requiring the user to type first.
   * The kick-off is sent as a system message (not a user message) so it
   * never appears in the visible transcript.
   */
  const handleSessionStarted = useCallback(
    async (id: string, methodIds: string[], cpId: string | null) => {
      setSessionId(id);
      setActiveMethodologyIds(methodIds);
      setActiveContextPackId(cpId);
      contextPackIdRef.current = cpId;
      setMessages([]);
      setCoachNotes([]);
      sessionStartRef.current = new Date();
      setPhase('active');

      // Send the kick-off as a system message so the AI opens the conversation.
      setIsTyping(true);
      try {
        const response = await fetch('/api/ai/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'message',
            sessionId: id,
            methodologyIds: methodIds,
            contextPackId: cpId ?? undefined,
            // System-level kick-off — never shown to user
            messages: [
              {
                role: 'system',
                content:
                  'Begin the roleplay now. Introduce yourself as the prospect in character. Keep your opening message natural and brief (1-3 sentences).',
              },
            ],
          }),
        });

        if (!response.ok || !response.body) {
          setIsTyping(false);
          return;
        }

        const assistantMsg: TranscriptMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages([assistantMsg]);

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
              setMessages([{ ...assistantMsg, content }]);
            } catch { /* ignore */ }
          }
        }
      } catch {
        // Non-fatal — user can start typing to open the conversation
      } finally {
        setIsTyping(false);
      }
    },
    [],
  );

  /**
   * Sends a message to the practice API and streams the AI response.
   * New assistant content is streamed token-by-token into the transcript.
   */
  const sendMessage = useCallback(
    async (
      sid: string,
      methodIds: string[],
      currentMessages: TranscriptMessage[],
      userContent: string,
    ) => {
      if (isSending) return;
      setIsSending(true);
      setIsTyping(true);

      // Add the user's message to the transcript immediately
      const userMsg: TranscriptMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userContent,
        timestamp: new Date(),
      };
      const nextMessages = [...currentMessages, userMsg];
      setMessages(nextMessages);

      // Build the messages array for the API (role + content only)
      const apiMessages = nextMessages.map(({ role, content }) => ({ role, content }));

      try {
        const response = await fetch('/api/ai/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'message',
            sessionId: sid,
            messages: apiMessages,
            methodologyIds: methodIds,
            contextPackId: contextPackIdRef.current ?? undefined,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to get AI response.');
        }

        // Prepare a placeholder assistant message for streaming into
        const assistantMsg: TranscriptMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Read the SSE stream token by token
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            const raw = line.slice(6); // strip "data: "
            if (raw === '[DONE]') break;

            try {
              const chunk = JSON.parse(raw) as string;
              assistantContent += chunk;
              // Update the last message with the accumulated content
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMsg, content: assistantContent };
                return updated;
              });
            } catch {
              // Ignore malformed SSE chunks
            }
          }
        }
      } catch (err) {
        // Show error as a system message in the transcript
        const errMsg: TranscriptMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `[Connection error: ${err instanceof Error ? err.message : 'Unknown error'}]`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
        setIsSending(false);
      }
    },
    [isSending],
  );

  /** Called when the user submits their typed message */
  function handleSend() {
    const text = inputText.trim();
    if (!text || !sessionId) return;
    setInputText('');
    void sendMessage(sessionId, activeMethodologyIds, messages, text);
  }

  /** Ends the active session, calls AI for real feedback, and transitions to summary */
  async function handleEndSession() {
    const elapsed = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
      : 0;
    setDurationSeconds(elapsed);
    setPhase('summary'); // Show summary immediately with loading state

    try {
      const response = await fetch('/api/ai/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionId,
          transcript: messages.map(({ role, content }) => ({ role, content })),
          methodologyIds: activeMethodologyIds,
          contextPackId: activeContextPackId ?? undefined,
          durationSeconds: elapsed,
        }),
      });

      if (!response.ok) throw new Error('Failed to get feedback.');

      const { score, feedback } = await response.json();
      setSummaryScore(score ?? null);
      setSummaryFeedback(feedback ?? null);
    } catch {
      // Non-fatal — show generic feedback if AI call fails
      setSummaryFeedback({
        strengths: ['Session completed.'],
        improvements: ['Review the conversation for insights.'],
        tips: ['Keep practicing to build your skills.'],
      });
    }
  }

  /** Resets everything back to setup */
  function handleRestart() {
    setPhase('setup');
    setSessionId(null);
    setMessages([]);
    setCoachNotes([]);
    setActiveMethodologyIds([]);
    setActiveContextPackId(null);
    contextPackIdRef.current = null;
    setSummaryScore(null);
    setSummaryFeedback(null);
    setDurationSeconds(0);
  }

  // Find methodology names for the coaching panel header
  const activeMethodologyNames = methodologies
    .filter((m) => activeMethodologyIds.includes(m.id))
    .map((m) => m.name);

  /* ── Render ── */

  if (phase === 'setup') {
    return (
      <GlassPanel className="max-w-2xl mx-auto p-6">
        <SessionSetup methodologies={methodologies} contextPacks={contextPacks} onSessionStarted={handleSessionStarted} />
      </GlassPanel>
    );
  }

  if (phase === 'summary') {
    return (
      <GlassPanel className="max-w-2xl mx-auto p-6">
        <SessionSummary
          score={summaryScore}
          feedback={summaryFeedback}
          messageCount={messages.filter((m) => m.role === 'user').length}
          durationSeconds={durationSeconds}
          onRestart={handleRestart}
        />
      </GlassPanel>
    );
  }

  // Active session: split-screen layout
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left panel: conversation transcript */}
      <GlassPanel className="flex flex-1 flex-col overflow-hidden p-0">
        {/* Transcript area */}
        <div className="flex-1 overflow-hidden">
          <TranscriptView messages={messages} isTyping={isTyping} />
        </div>

        {/* Input area */}
        <div className="border-t border-foreground/10 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your response..."
              disabled={isSending}
              className="flex-1 rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-600/50 disabled:opacity-50"
            />
            <Button onClick={handleSend} disabled={isSending || !inputText.trim()} size="sm">
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
          onClick={handleEndSession}
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
