/**
 * app/(admin)/layout.tsx — Admin-only route group layout.
 *
 * Server Component that protects all /admin/* routes by verifying:
 *   1. The user is authenticated (redirects to /login if not)
 *   2. The user has an "admin" role in the user_roles table
 *      (redirects to /dashboard if not an admin)
 *
 * This is a separate route group from (dashboard), so it does NOT
 * inherit the dashboard sidebar/header. Admin pages manage their
 * own navigation. For MVP, this layout wraps children in a simple
 * container with a back-to-dashboard link.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

/**
 * AdminLayout — Wraps all admin pages with role-based access control.
 * Only users with role="admin" in the user_roles table can access.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  /* Step 1: Check authentication */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  /* Step 2: Check admin role via SECURITY DEFINER function (bypasses RLS) */
  const { data: isAdmin } = await supabase
    .rpc('check_admin', { check_user_id: user.id });

  if (!isAdmin) {
    /* Not an admin — send them back to the regular dashboard */
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple admin header with back navigation */}
      <header className="glass border-b border-[var(--glass-border)] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
            >
              &larr; Back to Dashboard
            </Link>
            <span className="text-lg font-bold tracking-tight">SAIL Admin</span>
          </div>
          <span className="text-xs font-medium text-brand-600 bg-brand-600/10 px-2 py-1 rounded-md">
            Admin
          </span>
        </div>
      </header>

      {/* Admin page content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
