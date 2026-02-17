'use client';

/**
 * components/features/live-call/transcript-stream.tsx
 *
 * Live transcript panel using the Web Speech API.
 * Shows the captured speech in real time — final text is solid,
 * interim (in-progress) text is shown in a lighter style.
 *
 * Contains the mic control button and browser compatibility notice.
 * Uses the useSpeechRecognition hook from lib/hooks/use-speech-recognition.ts.
 */

import { useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/lib/hooks/use-speech-recognition';

interface TranscriptStreamProps {
  /** Called whenever new final text is added to the transcript */
  onTranscriptUpdate: (fullTranscript: string) => void;
}

/**
 * TranscriptStream — Real-time speech capture panel.
 * Calls onTranscriptUpdate whenever the recognized transcript text grows.
 * Uses useEffect so the parent receives updates as speech is finalized,
 * not just on button toggle.
 */
export function TranscriptStream({ onTranscriptUpdate }: TranscriptStreamProps) {
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    start,
    stop,
  } = useSpeechRecognition('en-US');

  // Propagate transcript to parent whenever final text accumulates
  useEffect(() => {
    if (transcript) {
      onTranscriptUpdate(transcript);
    }
  }, [transcript, onTranscriptUpdate]);

  const handleToggle = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <p className="font-medium">Browser Not Supported</p>
        <p className="text-sm text-foreground/60 max-w-xs">
          Live transcript requires Chrome or Edge. Other browsers don&apos;t support the Web Speech API.
          You can still use the coaching feed by typing your conversation manually.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Mic control */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
          Live Transcript
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          className={`gap-1.5 ${isListening ? 'border-red-500/30 text-red-600 hover:bg-red-500/10' : ''}`}
        >
          {isListening ? (
            <>
              <MicOff className="h-3.5 w-3.5" />
              <span>Stop</span>
              <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-red-500" />
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              <span>Start Mic</span>
            </>
          )}
        </Button>
      </div>

      {/* Error notice */}
      {error && (
        <p className="rounded-md bg-red-500/10 px-2 py-1.5 text-xs text-red-600">{error}</p>
      )}

      {/* Transcript content */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-foreground/10 bg-foreground/5 p-3">
        {!transcript && !interimTranscript && (
          <p className="text-sm text-foreground/40 italic">
            {isListening ? 'Listening...' : 'Press "Start Mic" to begin capturing speech.'}
          </p>
        )}

        {/* Final transcript — solid text */}
        {transcript && (
          <span className="text-sm leading-relaxed text-foreground">{transcript}</span>
        )}

        {/* Interim transcript — lighter, partial text */}
        {interimTranscript && (
          <span className="text-sm leading-relaxed text-foreground/50 italic">
            {interimTranscript}
          </span>
        )}
      </div>

      {/* Word count */}
      {transcript && (
        <p className="text-right text-xs text-foreground/40">
          {transcript.trim().split(/\s+/).length} words
        </p>
      )}
    </div>
  );
}
