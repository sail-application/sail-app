/**
 * app/(auth)/callback/route.ts — OAuth callback route handler.
 *
 * This route handles the redirect back from Google OAuth. After the
 * user authenticates with Google, Supabase redirects them here with
 * an authorization code in the URL search params.
 *
 * Flow:
 *   1. Extract the "code" parameter from the URL
 *   2. Exchange the code for a Supabase session
 *   3. Check if the user's email is in the authorized_members table
 *   4. Redirect to /dashboard (authorized) or /unauthorized (not a member)
 *
 * Error handling redirects to /login with an error parameter.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /callback — Handles the OAuth code exchange.
 * Called automatically by the browser after Google redirects back.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  /* If no code was provided, something went wrong — send back to login */
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`
    );
  }

  try {
    const supabase = await createClient();

    /* Exchange the OAuth code for a full Supabase session */
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('OAuth code exchange failed:', exchangeError.message);
      return NextResponse.redirect(
        `${origin}/login?error=exchange_failed`
      );
    }

    /* Get the authenticated user to check their email */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      console.error('No email found on authenticated user');
      return NextResponse.redirect(
        `${origin}/login?error=no_email`
      );
    }

    /* Check if the user's email is in the authorized_members table.
     * Uses a SECURITY DEFINER function to bypass RLS — this avoids the
     * chicken-and-egg problem where the user needs to be authorized to
     * read the authorization table. The function checks case-insensitively
     * and verifies is_active = true. */
    const { data: isMember } = await supabase
      .rpc('check_membership', { user_email: user.email.toLowerCase() });

    if (!isMember) {
      /* User authenticated but not a Skool community member */
      return NextResponse.redirect(`${origin}/unauthorized`);
    }

    /* User is authenticated AND authorized — send to dashboard */
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error) {
    /* Catch-all for unexpected errors during the callback flow */
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${origin}/login?error=callback_failed`
    );
  }
}
