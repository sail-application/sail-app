/**
 * components/layout/header.tsx — Top header bar for the dashboard.
 *
 * Displays the current page title (derived from the URL pathname),
 * the authenticated user's avatar/name on the right, and a sign-out
 * button. Uses the SupabaseProvider context for user information
 * and sign-out functionality.
 *
 * The header uses a glassmorphism background with a bottom border
 * to visually separate it from the main content area below.
 */

'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { cn } from '@/lib/utils/cn';

/**
 * Maps URL path segments to human-readable page titles.
 * If a path is not listed here, we fall back to capitalizing the segment.
 */
const pageTitleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/live-call': 'Live Call Assistant',
  '/dashboard/practice': 'Practice Mode',
  '/dashboard/email': 'Email Composition',
  '/dashboard/analyzer': 'Call Analyzer',
  '/dashboard/strategies': 'Strategies Library',
  '/dashboard/settings': 'Settings',
};

/**
 * Derives the page title from the current pathname.
 * Checks the map first; falls back to formatting the last URL segment.
 */
function getPageTitle(pathname: string): string {
  if (pageTitleMap[pathname]) return pageTitleMap[pathname];

  // Fallback: take the last segment and capitalize it
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || 'Dashboard';
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}

/**
 * Extracts user initials from their full name or email.
 * Returns up to 2 uppercase characters for the avatar circle.
 */
function getInitials(name?: string, email?: string): string {
  const source = name || email || '?';
  const parts = source.split(/[\s@]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Header — The top bar displayed above the main content area.
 * Shows the page title on the left and user info + sign out on the right.
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase, user } = useSupabase();

  /** Signs the user out and redirects to the login page */
  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      // Log the error but still redirect — the session may already be invalid
      console.error('Sign out error:', error);
      router.push('/login');
    }
  }, [supabase, router]);

  const displayName = user?.user_metadata?.full_name || user?.email || 'User';
  const initials = getInitials(user?.user_metadata?.full_name, user?.email);

  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 py-4',
        'glass border-b border-[var(--glass-border)]',
        'sticky top-0 z-10'
      )}
    >
      {/* Page title — derived from the current URL */}
      <h1 className="text-xl font-semibold tracking-tight">{getPageTitle(pathname)}</h1>

      {/* User info and sign-out button */}
      <div className="flex items-center gap-4">
        {/* User avatar circle with initials */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-medium text-foreground/80">
            {displayName}
          </span>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2',
            'text-sm text-foreground/50 hover:text-foreground/80',
            'hover:bg-white/10 transition-colors duration-150',
            'cursor-pointer'
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
