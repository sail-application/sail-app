/**
 * lib/hooks/use-speech-recognition.ts
 *
 * React hook wrapping the browser's Web Speech API (SpeechRecognition).
 * Provides a clean, typed interface for capturing live speech during
 * Practice Mode and Live Call sessions.
 *
 * Returns:
 *   - transcript: accumulated text from the current recognition session
 *   - interimTranscript: partial (not-yet-final) text from the current utterance
 *   - isListening: whether the mic is currently active
 *   - isSupported: whether the browser supports Web Speech API
 *   - error: any recognition error message
 *   - start(): begin capturing speech
 *   - stop(): stop capturing speech
 *   - reset(): clear transcript and stop
 *
 * Notes:
 *   - Chrome and Edge have the best Web Speech API support.
 *   - Firefox and Safari have limited or no support.
 *   - The hook does NOT send audio to any server — all processing is local.
 *   - Continuous mode is on by default so speech isn't cut off mid-sentence.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Browser Web Speech API types (not in standard @types/lib yet)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Global type declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
  }
}

export interface UseSpeechRecognitionReturn {
  /** Final transcript accumulated so far in this session */
  transcript: string;
  /** Partial text from the current (in-progress) utterance — changes rapidly */
  interimTranscript: string;
  /** Whether the microphone is currently capturing speech */
  isListening: boolean;
  /** Whether the current browser supports the Web Speech API */
  isSupported: boolean;
  /** Error message if recognition failed, null otherwise */
  error: string | null;
  /** Start capturing speech */
  start: () => void;
  /** Stop capturing speech (final transcript is preserved) */
  stop: () => void;
  /** Stop capturing and clear the transcript */
  reset: () => void;
}

/**
 * useSpeechRecognition — Wraps the browser Web Speech API.
 * Reusable by Practice Mode and Live Call Assistant.
 *
 * @param lang - BCP 47 language tag (default: 'en-US')
 */
export function useSpeechRecognition(lang = 'en-US'): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The recognition instance — persisted across renders
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Whether the browser has Web Speech API support
  const isSupported =
    typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition !== 'undefined' ||
      typeof window.webkitSpeechRecognition !== 'undefined');

  /**
   * Initializes the SpeechRecognition instance with event handlers.
   * Called once on mount.
   */
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionConstructor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;     // Don't stop after each utterance
    recognition.interimResults = true; // Stream partial results for low-latency display
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText);
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are non-fatal and expected during pauses
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current = recognition;

    // Clean up the recognition instance when the component unmounts
    return () => {
      recognition.abort();
    };
  }, [isSupported, lang]);

  /** Start capturing speech */
  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) return; // Already running
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Catching "already started" errors from rapid start/stop
      console.warn('[SpeechRecognition] start() error:', err);
    }
  }, [isListening]);

  /** Stop capturing speech (transcript is preserved) */
  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  /** Stop capturing and clear everything */
  const reset = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setTranscript('');
    setInterimTranscript('');
    setIsListening(false);
    setError(null);
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    start,
    stop,
    reset,
  };
}
