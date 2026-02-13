/**
 * app/api/webhooks/stripe/handlers.ts
 *
 * Event handler functions for each Stripe webhook event type.
 * Separated from the main route to keep files under the 200-line limit
 * and make each handler independently testable.
 *
 * All handlers use the admin Supabase client (bypasses RLS) because
 * webhook requests don't carry a user session.
 */

import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Handles a completed checkout session — typically when a new subscriber
 * completes payment for the first time.
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = createAdminClient();
  const customerEmail = session.customer_details?.email;

  if (!customerEmail) {
    console.warn('[Stripe] Checkout completed but no customer email found');
    return;
  }

  /* Update the user's subscription status in our database */
  await supabase.from('subscriptions').upsert(
    {
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      email: customerEmail,
      status: 'active',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_customer_id' }
  );

  console.log(`[Stripe] Checkout completed for ${customerEmail}`);
}

/**
 * Handles subscription status changes (upgrades, downgrades, renewals).
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(
    `[Stripe] Subscription ${subscription.id} updated to ${subscription.status}`
  );
}

/**
 * Handles subscription deletion (customer cancelled or Stripe removed it).
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`[Stripe] Subscription ${subscription.id} canceled`);
}

/**
 * Handles a failed invoice payment — flags the subscription for follow-up.
 * Uses line items to find the associated subscription since invoice.subscription
 * was removed in newer Stripe API versions.
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.lines?.data?.[0]?.subscription ?? null;

  if (subscriptionId) {
    console.warn(
      `[Stripe] Payment failed for subscription ${subscriptionId}, invoice ${invoice.id}`
    );
  } else {
    console.warn(
      `[Stripe] Payment failed for invoice ${invoice.id}, customer ${invoice.customer}`
    );
  }
}

/**
 * Logs a webhook event to the `webhook_events` table for audit trail
 * and debugging. Uses the admin client to bypass RLS.
 */
export async function logWebhookEvent(
  eventType: string,
  eventId: string,
  payload: Record<string, unknown>,
  status: 'processed' | 'failed',
  errorMessage?: string
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('webhook_events').insert({
      source: 'stripe',
      event_type: eventType,
      event_id: eventId,
      payload,
      status,
      error_message: errorMessage ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (logError) {
    // Logging failure should never crash the webhook handler
    console.error('[Stripe Webhook] Failed to log event:', logError);
  }
}
