/**
 * Supabase middleware helper — refreshes the auth session on every request.
 *
 * Called from the root middleware.ts. It creates a Supabase client that can
 * read cookies from the request and write updated cookies to the response.
 * The getUser() call triggers a token refresh if the access token is expired.
 *
 * Returns both the NextResponse (with updated cookies) and the user object
 * so the root middleware can make routing decisions (e.g., redirect to login).
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session and returns the response + user.
 * Must be called from Next.js middleware to keep sessions alive.
 */
export async function updateSession(request: NextRequest) {
  // Start with a "pass-through" response that forwards the original request
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip auth refresh if env vars are missing (e.g. during build)
  if (!supabaseUrl || !supabaseAnonKey) {
    return { supabaseResponse, user: null, supabase: null };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        /** Reads cookies from the incoming request. */
        getAll() {
          return request.cookies.getAll();
        },

        /**
         * Writes cookies to both the request (so downstream code sees them)
         * and the response (so the browser stores them). We must recreate
         * the NextResponse after mutating request cookies so the changes
         * are reflected in the final response headers.
         */
        setAll(cookiesToSet) {
          // Update cookies on the request object (for downstream middleware/pages)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Recreate the response so it picks up the mutated request cookies
          supabaseResponse = NextResponse.next({ request });

          // Also set the cookies on the outgoing response for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Calling getUser() triggers a token refresh if the access token is expired.
  // IMPORTANT: Do NOT use getSession() here — it doesn't validate the JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user, supabase };
}
