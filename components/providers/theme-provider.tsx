/**
 * components/providers/theme-provider.tsx
 *
 * Thin wrapper around next-themes ThemeProvider.
 *
 * Centralises the theme configuration so every layout that needs theming
 * can import a single component instead of repeating next-themes config.
 *
 * Configuration:
 *   - attribute="class" — toggles a `dark` class on <html> for Tailwind dark mode
 *   - defaultTheme="system" — respects the user's OS preference by default
 *   - enableSystem — allows "system" as a theme option
 *   - disableTransitionOnChange — prevents a flash of transition when switching themes
 */

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Wraps children with the next-themes provider pre-configured for
 * Tailwind's class-based dark mode strategy.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
