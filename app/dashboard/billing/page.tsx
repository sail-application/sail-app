import { Suspense } from 'react';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { SubscriptionCard } from '@/components/features/billing/subscription-card';
import { UsageCard } from '@/components/features/billing/usage-card';
import { PlanComparison } from '@/components/features/billing/plan-comparison';
import { InvoiceList } from '@/components/features/billing/invoice-list';
import { BillingLoading } from '@/components/features/billing/billing-loading';

/**
 * Billing Page
 *
 * Manage subscription, view usage, and access invoices
 */
export default async function BillingPage() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Please log in to access billing.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Billing & Subscription
        </h1>
        <p className="text-gray-400">
          Manage your subscription, view usage, and download invoices
        </p>
      </div>

      {/* Main Content */}
      <Suspense fallback={<BillingLoading />}>
        <BillingContent userId={user.id} />
      </Suspense>
    </div>
  );
}

async function BillingContent({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();

  // Fetch subscription data
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch usage data for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageEvents } = await supabase
    .from('usage_events')
    .select('feature, quantity')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="grid gap-6">
      {/* Current Subscription */}
      <SubscriptionCard subscription={subscription} userId={userId} />

      {/* Usage This Month */}
      <UsageCard
        subscription={subscription}
        usageEvents={(usageEvents || []) as Parameters<typeof UsageCard>[0]['usageEvents']}
        userId={userId}
      />

      {/* Plan Comparison */}
      {(!subscription || subscription.plan_tier === 'free') && (
        <PlanComparison currentTier={subscription?.plan_tier || 'free'} />
      )}

      {/* Invoice History */}
      {invoices && invoices.length > 0 && (
        <InvoiceList invoices={invoices} />
      )}
    </div>
  );
}

export const metadata = {
  title: 'Billing | SAIL',
  description: 'Manage your SAIL subscription and billing',
};
