/**
 * app/(auth)/login/page.tsx — Login page for SAIL.
 *
 * Server Component that renders the login screen with SAIL branding.
 * The actual OAuth logic lives in the LoginForm client component.
 *
 * Layout:
 *   - Full-screen centered layout with a glassmorphism panel
 *   - SAIL logo and app name at the top
 *   - "Sign in to continue" subtitle
 *   - LoginForm component with the Google OAuth button
 */

import type { Metadata } from 'next';
import { LoginForm } from './login-form';

/** Page-level metadata — shows "Login | SAIL" in the browser tab */
export const metadata: Metadata = {
  title: 'Login',
};

/**
 * LoginPage — The sign-in screen users see when not authenticated.
 * Centers a glass panel containing the SAIL logo and OAuth button.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass w-full max-w-md p-8 text-center">
        {/* SAIL logo and branding */}
        <div className="mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white text-2xl font-bold mb-4">
            S
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SAIL</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Sales AI Learning Platform
          </p>
        </div>

        {/* Subtitle */}
        <p className="mb-6 text-foreground/70">Sign in to continue</p>

        {/* Client-side login form with Google OAuth */}
        <LoginForm />

        {/* Footer note */}
        <p className="mt-6 text-xs text-foreground/40">
          Access is limited to SA Picture Day Skool community members.
        </p>
      </div>
    </main>
  );
}
