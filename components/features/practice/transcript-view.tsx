'use client';

/**
 * components/features/practice/transcript-view.tsx
 *
 * Scrolling conversation transcript panel for Practice Mode.
 * Shows the conversation between the user and the AI prospect,
 * with distinct visual styling for each role.
 *
 * Auto-scrolls to the bottom as new messages arrive.
 * Shows a typing indicator when the AI is generating a response.
 */

import { useEffect, useRef } from 'react';

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TranscriptViewProps {
  /** Messages in the conversation so far */
  messages: TranscriptMessage[];
  /** When true, shows a typing indicator at the bottom */
  isTyping: boolean;
}

/**
 * TranscriptView — Scrollable conversation log.
 * User messages appear on the right (blue), AI messages on the left (glass).
 */
export function TranscriptView({ messages, isTyping }: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex h-full flex-col overflow-y-auto space-y-4 p-4">
      {messages.length === 0 && !isTyping && (
        <div className="flex h-full items-center justify-center text-center">
          <p className="text-sm text-foreground/50 max-w-xs">
            The AI will play the role of your prospect. Start the conversation when you&apos;re ready.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Role avatar */}
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white'
                : 'bg-foreground/10 text-foreground/70'
            }`}
          >
            {msg.role === 'user' ? 'You' : 'AI'}
          </div>

          {/* Message bubble */}
          <div
            className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-foreground/8 text-foreground rounded-tl-sm border border-foreground/10'
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            <p
              className={`mt-1 text-right text-[11px] ${
                msg.role === 'user' ? 'text-white/60' : 'text-foreground/40'
              }`}
            >
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground/70">
            AI
          </div>
          <div className="rounded-xl rounded-tl-sm border border-foreground/10 bg-foreground/8 px-3 py-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
