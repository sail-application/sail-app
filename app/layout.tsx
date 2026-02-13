/**
 * app/layout.tsx — Root layout for the SAIL application.
 *
 * This is the top-level Server Component layout that wraps every page.
 * It sets up:
 *   - HTML metadata (title template, description, viewport)
 *   - The <Providers> client component tree (theme, Supabase auth, analytics)
 *   - A system font stack (no external Google Fonts dependency)
 *   - Global CSS import
 *
 * All child routes (auth, dashboard, admin) inherit from this layout.
 */

import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

/** Site-wide metadata using Next.js Metadata API */
export const metadata: Metadata = {
  title: {
    template: '%s | SAIL',
    default: 'SAIL — Sales AI Learning Platform',
  },
  description: 'AI-powered sales training for volume photographers',
};

/**
 * RootLayout — The outermost layout wrapping the entire app.
 * Renders the HTML shell and wraps children in client-side providers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
