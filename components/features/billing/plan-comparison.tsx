'use client';

import { useState } from 'react';

interface PlanComparisonProps {
  currentTier: string;
}

export function PlanComparison({}: PlanComparisonProps) { // TODO: highlight currentTier plan card
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const plans = [
    {
      tier: 'individual',
      name: 'Individual',
      price: 29,
      features: [
        'Unlimited live call minutes',
        'Unlimited practice sessions',
        'Unlimited email generation',
        'Unlimited call analyses',
        'All 13+ methodologies',
        'Email support'
      ],
      cta: 'Upgrade to Individual',
      highlighted: false
    },
    {
      tier: 'pro',
      name: 'Pro',
      price: 79,
      features: [
        'Everything in Individual',
        'Advanced analytics dashboard',
        'Custom methodology creation',
        'Priority support',
        'Early access to new features',
        'Export data & reports'
      ],
      cta: 'Upgrade to Pro',
      highlighted: true
    },
    {
      tier: 'team',
      name: 'Team',
      price: 49,
      priceUnit: 'per user',
      features: [
        'Everything in Pro',
        'Team dashboard & leaderboard',
        'Shared methodology library',
        'Manager coaching inbox',
        'Team analytics',
        'Dedicated support'
      ],
      cta: 'Upgrade to Team',
      highlighted: false
    }
  ];

  const handleUpgrade = async (tier: string) => {
    setIsLoading(tier);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_tier: tier })
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl" id="plans">
      <h2 className="text-2xl font-bold text-white mb-6">
        Choose Your Plan
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.tier}
            className={`relative rounded-xl p-6 ${
              plan.highlighted
                ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50'
                : 'bg-gray-800/50 border border-gray-700/50'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">
                  ${plan.price}
                </span>
                <span className="text-gray-400">/month</span>
              </div>
              {plan.priceUnit && (
                <p className="text-sm text-gray-400 mt-1">{plan.priceUnit}</p>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <svg
                    className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.tier)}
              disabled={isLoading !== null}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.highlighted
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              } disabled:opacity-50`}
            >
              {isLoading === plan.tier ? 'Loading...' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
