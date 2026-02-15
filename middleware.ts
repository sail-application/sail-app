/**
 * middleware.ts — Root Next.js middleware for the SAIL platform.
 *
 * Runs on every matched request before the page or API route renders.
 * Responsibilities:
 *   1. Refresh the Supabase auth session (keeps cookies alive)
 *   2. Protect /dashboard routes — redirect unauthenticated users to /login
 *   3. Protect /admin routes — verify the user has the 'admin' role
 *   4. Add security headers to every response
 *   5. Add rate-limit tracking headers on API routes
 *
 * The updateSession helper (from @/lib/supabase/middleware) returns:
 *   - supabaseResponse: NextResponse with refreshed auth cookies
 *   - user: the authenticated Supabase user (or null)
 *   - supabase: the middleware Supabase client for additional queries
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Adds security headers to the response to mitigate common web vulnerabilities.
 * Applied to every response that passes through the middleware.
 */
function applySecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
}

/**
 * Adds rate-limit tracking headers to API route responses.
 * These are informational headers — actual enforcement happens in the
 * individual API route handlers. The headers signal to clients how to
 * interpret rate-limit state.
 */
function applyRateLimitHeaders(response: NextResponse): void {
  // Default quota for API routes — individual routes may override these
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '100');
  response.headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60));
}

/**
 * Builds a redirect Response to the /login page, preserving the original
 * path as a `redirect` query param so we can send the user back after login.
 */
function redirectToLogin(request: NextRequest): Response {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Builds a redirect Response to the /dashboard page when a non-admin
 * user tries to access /admin routes.
 */
function redirectToDashboard(request: NextRequest): Response {
  const url = request.nextUrl.clone();
  url.pathname = '/dashboard';
  return NextResponse.redirect(url);
}

/**
 * Main middleware function — orchestrates auth refresh, route protection,
 * security headers, and rate-limit tracking.
 */
export async function middleware(request: NextRequest) {
  // 1. Refresh the Supabase auth session and retrieve the user
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 2. Apply security headers to every response
  applySecurityHeaders(supabaseResponse);

  // 3. Apply rate-limit tracking headers to API routes
  if (pathname.startsWith('/api')) {
    applyRateLimitHeaders(supabaseResponse);
  }

  // 4. Protect /dashboard and /admin — require an authenticated user
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    if (!user) {
      return redirectToLogin(request);
    }
  }

  // 5. Protect /admin — additionally require the 'admin' role
  //    Uses a SECURITY DEFINER RPC to bypass RLS (auth.uid() can be
  //    unreliable in middleware/server component Supabase clients)
  if (pathname.startsWith('/admin') && user && supabase) {
    try {
      const { data: isAdmin } = await supabase
        .rpc('check_admin', { check_user_id: user.id });

      if (!isAdmin) {
        return redirectToDashboard(request);
      }
    } catch {
      // If the role check throws unexpectedly, deny access to be safe
      return redirectToDashboard(request);
    }
  }

  return supabaseResponse;
}

/**
 * Matcher config — tells Next.js which routes this middleware applies to.
 * Excludes static assets and image files to avoid unnecessary processing.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
