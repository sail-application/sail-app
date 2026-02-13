/**
 * components/providers/index.tsx
 *
 * Composes all client-side providers into a single <Providers> wrapper.
 *
 * Nesting order (outermost → innermost):
 *   1. ThemeProvider — applies dark/light class to <html> (no dependencies)
 *   2. SupabaseProvider — creates the Supabase client and tracks auth state
 *   3. AnalyticsProvider — initialises PostHog + Vercel Analytics
 *
 * ThemeProvider is outermost because it touches the DOM root element.
 * SupabaseProvider comes next so analytics can access the user if needed.
 * AnalyticsProvider is innermost because it only emits, never consumed.
 *
 * Usage in the root layout:
 *   <Providers>{children}</Providers>
 */

'use client';

import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

/**
 * Single wrapper that composes all client-side context providers.
 * Import this in the root layout to avoid deeply nested JSX.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SupabaseProvider>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}
