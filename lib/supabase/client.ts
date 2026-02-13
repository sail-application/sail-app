/**
 * Browser-side Supabase client.
 *
 * Uses @supabase/ssr's createBrowserClient which automatically handles
 * cookie-based auth sessions in the browser. This is the ONLY Supabase
 * client that should be used in Client Components ("use client" files).
 *
 * During build-time prerendering, env vars may be empty — we provide
 * placeholder values so the client constructor doesn't throw. The client
 * is never actually used during static generation.
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createBrowserClient } from '@supabase/ssr';

/** Creates a Supabase client for use in browser/client components. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  );
}
