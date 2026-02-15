/**
 * components/providers/methodology-provider.tsx
 *
 * React context that preloads the user's active methodology on login.
 * Provides useMethodology() hook for any component to access the active
 * methodology's data without refetching.
 *
 * Placed inside SupabaseProvider so it has access to auth state.
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Methodology, UserMethodologyPreference } from '@/types/methodology';

/* ──────────────── Context Shape ──────────────── */

interface MethodologyContextValue {
  /** The user's primary active methodology (null if none selected) */
  methodology: Methodology | null;
  /** The user's methodology preferences */
  preferences: UserMethodologyPreference[];
  /** Whether the methodology is still loading */
  isLoading: boolean;
  /** Refresh the methodology data (e.g., after user changes primary) */
  refresh: () => Promise<void>;
}

const MethodologyContext = createContext<MethodologyContextValue>({
  methodology: null,
  preferences: [],
  isLoading: true,
  refresh: async () => {},
});

/* ──────────────── Provider Component ──────────────── */

export function MethodologyProvider({ children }: { children: ReactNode }) {
  const [methodology, setMethodology] = useState<Methodology | null>(null);
  const [preferences, setPreferences] = useState<UserMethodologyPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMethodology = useCallback(async () => {
    try {
      // Fetch preferences and primary methodology via API
      const res = await fetch('/api/methodologies/preferences');
      if (!res.ok) {
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setPreferences(data.preferences ?? []);

      // Find the primary preference
      const primary = data.preferences?.find(
        (p: UserMethodologyPreference) => p.is_primary,
      );

      if (primary?.methodology_id) {
        // Fetch the full methodology data
        const methRes = await fetch(
          `/api/methodologies/${primary.methodology_id}`,
        );
        if (methRes.ok) {
          const methData = await methRes.json();
          setMethodology(methData.methodology ?? null);
        }
      }
    } catch (err) {
      console.error('[MethodologyProvider] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMethodology();
  }, [loadMethodology]);

  return (
    <MethodologyContext.Provider
      value={{ methodology, preferences, isLoading, refresh: loadMethodology }}
    >
      {children}
    </MethodologyContext.Provider>
  );
}

/* ──────────────── Hook ──────────────── */

/**
 * Access the user's active methodology from any component.
 * Must be used inside a MethodologyProvider.
 */
export function useMethodology(): MethodologyContextValue {
  return useContext(MethodologyContext);
}
