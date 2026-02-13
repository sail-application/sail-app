/**
 * app/api/webhooks/skool/route.ts
 *
 * Skool community webhook handler. Processes member_joined and member_left
 * events to manage the `authorized_members` table that gates access to SAIL.
 *
 * Authentication: A shared secret is sent in the `x-skool-secret` header.
 * This must match the SKOOL_WEBHOOK_SECRET environment variable.
 *
 * Required env vars:
 *   - SKOOL_WEBHOOK_SECRET
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** The shared secret used to verify requests actually come from Skool */
const SKOOL_SECRET = process.env.SKOOL_WEBHOOK_SECRET;

/**
 * Logs a webhook event to the `webhook_events` table for audit trail.
 * Uses the admin client to bypass RLS.
 */
async function logWebhookEvent(
  eventType: string,
  payload: Record<string, unknown>,
  status: 'processed' | 'failed',
  errorMessage?: string
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('webhook_events').insert({
      source: 'skool',
      event_type: eventType,
      event_id: `skool_${Date.now()}`,
      payload,
      status,
      error_message: errorMessage ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (logError) {
    // Logging failure should never crash the webhook handler
    console.error('[Skool Webhook] Failed to log event:', logError);
  }
}

/**
 * Handles a new member joining the Skool community.
 * Adds their email to `authorized_members` so they can access SAIL.
 */
async function handleMemberJoined(email: string, name?: string) {
  const supabase = createAdminClient();

  /* Upsert so re-joining members are simply reactivated */
  const { error } = await supabase.from('authorized_members').upsert(
    {
      email: email.toLowerCase(),
      name: name ?? null,
      is_active: true,
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('[Skool] Failed to add authorized member:', error);
    throw error;
  }

  console.log(`[Skool] Member joined: ${email}`);
}

/**
 * Handles a member leaving the Skool community.
 * Sets is_active=false in `authorized_members` to revoke SAIL access.
 * We soft-delete rather than hard-delete to preserve history.
 */
async function handleMemberLeft(email: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('authorized_members')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq('email', email.toLowerCase());

  if (error) {
    console.error('[Skool] Failed to deactivate member:', error);
    throw error;
  }

  console.log(`[Skool] Member left: ${email}`);
}

/**
 * POST /api/webhooks/skool
 * Receives Skool community membership events and updates the
 * authorized_members table to control access gating.
 */
export async function POST(request: NextRequest) {
  try {
    /* ── 1. Validate the shared secret header ── */
    const secret = request.headers.get('x-skool-secret');

    if (!SKOOL_SECRET || secret !== SKOOL_SECRET) {
      console.warn('[Skool Webhook] Invalid or missing secret header');
      return NextResponse.json(
        { error: 'Unauthorized. Invalid webhook secret.' },
        { status: 401 }
      );
    }

    /* ── 2. Parse the request body ── */
    const body = await request.json();
    const { event, email, name } = body as {
      event: string;
      email?: string;
      name?: string;
    };

    if (!event || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: event, email.' },
        { status: 400 }
      );
    }

    /* ── 3. Route to the appropriate handler ── */
    switch (event) {
      case 'member_joined':
        await handleMemberJoined(email, name);
        break;
      case 'member_left':
        await handleMemberLeft(email);
        break;
      default:
        console.log(`[Skool Webhook] Unhandled event type: ${event}`);
    }

    /* ── 4. Log the event for audit trail ── */
    await logWebhookEvent(event, body as Record<string, unknown>, 'processed');

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Skool Webhook] Unhandled error:', error);

    /* Attempt to log the failure */
    await logWebhookEvent(
      'unknown',
      { error: String(error) },
      'failed',
      String(error)
    );

    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
