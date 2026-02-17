'use client';

/**
 * lib/hooks/use-practice-session.ts
 *
 * Custom hook that owns all state and async logic for Practice Mode.
 * Extracted from practice-session.tsx to keep that component under 200 lines.
 *
 * Responsibilities:
 *   - Session lifecycle state (sessionId, phase data, timing)
 *   - SSE kickoff when a session starts (opens AI roleplay automatically)
 *   - SSE streaming for each user message (token-by-token transcript updates)
 *   - End-session API call to get real AI feedback + scorecard
 *   - Full reset back to setup state
 *
 * The component that consumes this hook is responsible for:
 *   - Rendering the correct phase (setup / active / summary)
 *   - Passing inputText changes back via setInputText
 *   - Calling handleSend, handleEndSession, handleRestart on user actions
 */

import { useState, useCallback, useRef } from 'react';
import type { TranscriptMessage } from '@/components/features/practice/transcript-view';
import type { CoachNote } from '@/components/features/practice/coaching-panel';

/** Shape of the score returned by the end-session API */
export interface SessionScore {
  overall: number;
  dimensions?: Record<string, number>;
}

/** Shape of the feedback returned by the end-session API */
export interface SessionFeedback {
  strengths?: string[];
  improvements?: string[];
  tips?: string[];
}

/**
 * usePracticeSession — manages all state and async operations for a practice session.
 *
 * @returns Session state values and handler functions consumed by PracticeSession.
 */
export function usePracticeSession() {
  // ── Core session identifiers ──
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeMethodologyIds, setActiveMethodologyIds] = useState<string[]>([]);
  const [activeContextPackId, setActiveContextPackId] = useState<string | null>(null);

  // Ref keeps the context pack ID accessible inside async callbacks without stale closure issues
  const contextPackIdRef = useRef<string | null>(null);

  // ── Transcript state ──
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ── Coaching sidebar ──
  const [coachNotes, setCoachNotes] = useState<CoachNote[]>([]);

  // ── Session timing ──
  const sessionStartRef = useRef<Date | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // ── Summary state (populated when session ends) ──
  const [summaryScore, setSummaryScore] = useState<SessionScore | null>(null);
  const [summaryFeedback, setSummaryFeedback] = useState<SessionFeedback | null>(null);

  // ── SSE helper: reads a streaming response and pipes tokens to a callback ──
  async function streamSSE(
    response: Response,
    onChunk: (accumulated: string) => void,
  ): Promise<void> {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const raw = line.slice(6); // strip "data: "
        if (raw === '[DONE]') return;
        try {
          const chunk = JSON.parse(raw) as string;
          content += chunk;
          onChunk(content);
        } catch {
          // Ignore malformed SSE chunks
        }
      }
    }
  }

  /**
   * Called by SessionSetup after the API creates a new session.
   * Fires an invisible system kick-off prompt so the AI opens the roleplay
   * without requiring the user to type first.
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
      // Phase transition is handled by the consumer — we return sessionId via state

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
            // System-level kick-off — never shown to user in the transcript
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

        // Create a placeholder assistant message, then stream into it
        const assistantMsg: TranscriptMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages([assistantMsg]);

        await streamSSE(response, (accumulated) => {
          setMessages([{ ...assistantMsg, content: accumulated }]);
        });
      } catch {
        // Non-fatal — user can still type to open the conversation
      } finally {
        setIsTyping(false);
      }
    },
    [],
  );

  /**
   * Sends a user message and streams the AI response token-by-token into the transcript.
   *
   * @param sid      Active session ID
   * @param methodIds  Active methodology IDs (needed by the API)
   * @param currentMessages  Current transcript (so we can append without stale state)
   * @param userContent  The text the user typed
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

      // Append the user's message immediately so the transcript updates at once
      const userMsg: TranscriptMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userContent,
        timestamp: new Date(),
      };
      const nextMessages = [...currentMessages, userMsg];
      setMessages(nextMessages);

      try {
        const response = await fetch('/api/ai/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'message',
            sessionId: sid,
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
            methodologyIds: methodIds,
            contextPackId: contextPackIdRef.current ?? undefined,
          }),
        });

        if (!response.ok || !response.body) throw new Error('Failed to get AI response.');

        // Append a streaming placeholder, then fill it in token by token
        const assistantMsg: TranscriptMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        await streamSSE(response, (accumulated) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMsg, content: accumulated };
            return updated;
          });
        });
      } catch (err) {
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

  /**
   * Handles the "Send" button / Enter key in the active session.
   * Reads inputText, clears it, and delegates to sendMessage.
   */
  function handleSend(sid: string, methodIds: string[], currentMessages: TranscriptMessage[]) {
    const text = inputText.trim();
    if (!text || !sid) return;
    setInputText('');
    void sendMessage(sid, methodIds, currentMessages, text);
  }

  /**
   * Ends the active session:
   * 1. Calculates duration
   * 2. Calls /api/ai/practice action:'end' for real AI feedback
   * 3. Populates summaryScore + summaryFeedback for the summary screen
   *
   * The consumer should transition to 'summary' phase before calling this
   * so the loading state is immediately visible.
   */
  async function handleEndSession(
    sid: string | null,
    currentMessages: TranscriptMessage[],
    methodIds: string[],
    cpId: string | null,
  ) {
    const elapsed = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
      : 0;
    setDurationSeconds(elapsed);

    try {
      const response = await fetch('/api/ai/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionId: sid,
          transcript: currentMessages.map(({ role, content }) => ({ role, content })),
          methodologyIds: methodIds,
          contextPackId: cpId ?? undefined,
          durationSeconds: elapsed,
        }),
      });

      if (!response.ok) throw new Error('Failed to get feedback.');

      const { score, feedback } = await response.json();
      setSummaryScore(score ?? null);
      setSummaryFeedback(feedback ?? null);
    } catch {
      // Non-fatal: show a generic fallback so the summary screen is never blank
      setSummaryFeedback({
        strengths: ['Session completed.'],
        improvements: ['Review the conversation for insights.'],
        tips: ['Keep practicing to build your skills.'],
      });
    }
  }

  /** Resets all session state back to the setup phase */
  function handleRestart() {
    setSessionId(null);
    setMessages([]);
    setCoachNotes([]);
    setActiveMethodologyIds([]);
    setActiveContextPackId(null);
    contextPackIdRef.current = null;
    setSummaryScore(null);
    setSummaryFeedback(null);
    setDurationSeconds(0);
    setInputText('');
  }

  return {
    // State
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
    // Setters needed by the component
    setInputText,
    // Handlers
    handleSessionStarted,
    handleSend,
    handleEndSession,
    handleRestart,
  };
}
