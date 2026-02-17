'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Subscription } from '@/types/database';

interface SubscriptionCardProps {
  subscription: Subscription | null;
  userId: string;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const planTier = subscription?.plan_tier || 'free';
  const status = subscription?.status || 'inactive';

  // Plan names and prices
  const planInfo = {
    free: { name: 'Free', price: '$0', color: 'gray' },
    individual: { name: 'Individual', price: '$29', color: 'blue' },
    pro: { name: 'Pro', price: '$79', color: 'purple' },
    team: { name: 'Team', price: '$49', color: 'green' }
  };

  const currentPlan = planInfo[planTier as keyof typeof planInfo];

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create portal session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/dashboard/billing#plans');
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">
          Current Subscription
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${currentPlan.color}-500/20 text-${currentPlan.color}-400`}>
          {currentPlan.name}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Plan Details */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {currentPlan.price}
          </span>
          <span className="text-gray-400">/month</span>
        </div>

        {/* Status */}
        {subscription && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`capitalize ${status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {status}
              </span>
            </div>
            {subscription.current_period_end && (
              <div className="flex justify-between">
                <span className="text-gray-400">Renews:</span>
                <span className="text-white">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {planTier === 'free' ? (
            <button
              onClick={handleUpgrade}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Upgrade Plan
            </button>
          ) : (
            <button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
