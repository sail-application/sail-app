/**
 * Service-role Supabase client — bypasses all RLS policies.
 *
 * DANGEROUS: This client has full read/write access to every table.
 * Only use in trusted server contexts:
 *   - Webhook handlers
 *   - Background jobs / Edge Functions
 *   - Admin API routes with proper auth checks
 *
 * NEVER expose this client to the browser or import it in Client Components.
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service_role key.
 * Bypasses all RLS policies. Use ONLY in trusted server contexts.
 * Throws immediately if required env vars are missing (fail-fast).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. ' +
        'These are required for the admin client. Check your .env file.',
    );
  }

  return createClient(url, key, {
    auth: {
      // Service role client doesn't need session management
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
