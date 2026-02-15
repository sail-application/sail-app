/**
 * app/dashboard/layout.tsx — Protected dashboard layout.
 *
 * Server Component that gates access to all dashboard routes:
 *   1. Checks if the user is authenticated (redirects to /login if not)
 *   2. Checks if the user's email exists in the authorized_members table
 *      (redirects to /unauthorized if not — Skool community gating)
 *
 * Once authorized, renders the responsive dashboard shell:
 *   - Desktop: Sidebar on the left, Header + content on the right
 *   - Mobile: Header on top, content in the middle, MobileNav at bottom
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

/**
 * DashboardLayout — Wraps all /dashboard/* pages with auth checks and navigation.
 * This is a Server Component; the Sidebar/Header/MobileNav are client components.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  /* Step 1: Check authentication — redirect to login if no session */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  /* Step 2: Check Skool community membership via SECURITY DEFINER function.
   * Bypasses RLS to avoid the chicken-and-egg problem where users need
   * authorization to read the authorization table. */
  const { data: isMember } = await supabase
    .rpc('check_membership', { user_email: user.email!.toLowerCase() });

  if (!isMember) {
    redirect('/unauthorized');
  }

  /* Step 3: Check if user has admin role — controls Admin link visibility */
  const { data: roleRecord } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  const isAdmin = roleRecord?.role === 'admin';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — visible on md+ screens, hidden on mobile */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main content area — fills remaining space */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header — sticky top bar with page title and user info */}
        <Header />

        {/* Page content — scrollable, with bottom padding for mobile nav */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>

        {/* Mobile bottom navigation — visible on mobile, hidden on md+ */}
        <MobileNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}
