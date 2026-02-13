/**
 * Server-side Supabase client for Next.js 15 App Router.
 *
 * Uses @supabase/ssr's createServerClient with the Next.js cookie adapter.
 * The cookies() call is async in Next.js 15 — we await it before passing
 * the cookie store into the Supabase client.
 *
 * Use this in:
 *   - Server Components
 *   - Server Actions
 *   - Route Handlers (API routes)
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Creates a Supabase client bound to the current request's cookies. */
export async function createClient() {
  // In Next.js 15, cookies() returns a Promise — must await it
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        /** Reads all cookies from the incoming request. */
        getAll() {
          return cookieStore.getAll();
        },

        /**
         * Sets cookies on the response. Wrapped in try/catch because
         * setAll may be called from a Server Component where cookies
         * are read-only — in that case we silently ignore the error.
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies are read-only.
            // The middleware will handle refreshing the session instead.
          }
        },
      },
    },
  );
}
