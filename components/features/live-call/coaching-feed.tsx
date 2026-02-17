'use client';

/**
 * components/features/live-call/coaching-feed.tsx
 *
 * Streaming coaching suggestions panel for Live Call Assistant.
 * Shows the most recent AI coaching suggestion at the top.
 * Each new coaching suggestion streams in token by token.
 *
 * Suggestions are triggered by the parent (CallCockpit) when
 * the transcript reaches a threshold of new words.
 */

import { Lightbulb } from 'lucide-react';

export interface CoachingEvent {
  id: string;
  timestamp: Date;
  content: string;
  isStreaming?: boolean;
}

interface CoachingFeedProps {
  /** All coaching events so far (newest first) */
  events: CoachingEvent[];
}

/**
 * CoachingFeed — Reverse-chronological feed of AI coaching suggestions.
 * The most recent (or currently streaming) suggestion appears at the top.
 */
export function CoachingFeed({ events }: CoachingFeedProps) {
  const [latest, ...older] = events;

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
        AI Coaching
      </p>

      {events.length === 0 && (
        <div className="flex h-full items-center justify-center text-center">
          <p className="text-sm text-foreground/40 max-w-[180px]">
            Coaching suggestions will stream in as you talk.
          </p>
        </div>
      )}

      {/* Latest suggestion — prominently displayed */}
      {latest && (
        <div className="rounded-xl border border-brand-600/20 bg-brand-600/10 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-600">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Latest Tip</span>
            {latest.isStreaming && (
              <span className="ml-auto flex items-center gap-1 text-foreground/50 font-normal">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
                generating...
              </span>
            )}
            {!latest.isStreaming && (
              <span className="ml-auto font-normal text-foreground/40">
                {latest.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <p className="text-sm leading-snug text-foreground/80">
            {latest.content || <span className="italic text-foreground/40">Thinking...</span>}
          </p>
        </div>
      )}

      {/* Older suggestions — compact, faded */}
      {older.length > 0 && (
        <div className="space-y-2 overflow-y-auto">
          <p className="text-xs text-foreground/40">Earlier suggestions</p>
          {older.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-foreground/10 px-3 py-2"
            >
              <div className="mb-0.5 flex items-center justify-between text-xs text-foreground/40">
                <span>
                  {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-foreground/60 leading-snug">{event.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
