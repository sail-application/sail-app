/**
 * app/api/webhooks/stripe/route.ts
 *
 * Stripe webhook handler. Receives events from Stripe (checkout completed,
 * subscription changes, payment failures) and processes them.
 *
 * CRITICAL: The webhook signature is validated before any event processing
 * to prevent spoofed requests. The raw body must be read with request.text()
 * (not request.json()) to preserve the exact payload for signature verification.
 *
 * Event handler logic lives in ./handlers.ts to keep this file focused on
 * signature validation and event routing.
 *
 * Required env vars:
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
  logWebhookEvent,
} from './handlers';

/** Lazily initialize Stripe to avoid build-time errors when env vars are missing */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key);
}

/**
 * POST /api/webhooks/stripe
 * Receives and processes Stripe webhook events after validating the signature.
 */
export async function POST(request: NextRequest) {
  try {
    /* ── 1. Read the raw body and signature header ── */
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header.' },
        { status: 400 }
      );
    }

    /* ── 2. Verify the webhook signature (CRITICAL — prevents spoofing) ── */
    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (verifyError) {
      console.error(
        '[Stripe Webhook] Signature verification failed:',
        verifyError
      );
      return NextResponse.json(
        { error: 'Invalid webhook signature.' },
        { status: 400 }
      );
    }

    /* ── 3. Route the event to the appropriate handler ── */
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    /* ── 4. Log the event for audit trail ── */
    await logWebhookEvent(
      event.type,
      event.id,
      event.data.object as unknown as Record<string, unknown>,
      'processed'
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
