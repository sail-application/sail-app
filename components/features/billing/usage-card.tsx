'use client';

import type { Subscription, UsageEvent } from '@/types/database';

interface UsageCardProps {
  subscription: Subscription | null;
  usageEvents: UsageEvent[];
  userId: string;
}

export function UsageCard({ subscription, usageEvents }: UsageCardProps) {
  const planTier = subscription?.plan_tier || 'free';
  const isUnlimited = ['individual', 'pro', 'team'].includes(planTier);

  // Aggregate usage by feature
  const usage = usageEvents.reduce((acc, event) => {
    if (!acc[event.feature]) {
      acc[event.feature] = 0;
    }
    acc[event.feature] += Number(event.quantity);
    return acc;
  }, {} as Record<string, number>);

  // Define limits for free tier
  const limits = {
    'live-call': 30, // minutes
    'practice': 5, // sessions
    'email': 3, // emails
    'analyzer': 2 // analyses
  };

  const features = [
    { key: 'live-call' as const, label: 'Live Call Minutes', unit: 'min' },
    { key: 'practice' as const, label: 'Practice Sessions', unit: 'sessions' },
    { key: 'email' as const, label: 'Emails Generated', unit: 'emails' },
    { key: 'analyzer' as const, label: 'Call Analyses', unit: 'analyses' }
  ];

  return (
    <div className="glass-card p-6 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">
          Usage This Month
        </h2>
        {isUnlimited && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
            Unlimited
          </span>
        )}
      </div>

      {/* Usage Meters */}
      <div className="space-y-6">
        {features.map(({ key, label, unit }) => {
          const used = usage[key] || 0;
          const limit = limits[key];
          const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
          const remaining = isUnlimited ? null : Math.max(limit - used, 0);

          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">{label}</span>
                <span className="text-white">
                  {isUnlimited ? (
                    `${used} ${unit}`
                  ) : (
                    `${used} / ${limit} ${unit}`
                  )}
                </span>
              </div>

              {!isUnlimited && (
                <>
                  <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percentage >= 100 ? 'bg-red-500' :
                        percentage >= 80 ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {remaining !== null && remaining <= 1 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      {remaining === 0 ? 'Limit reached' : `${remaining} ${unit} remaining`}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {!isUnlimited && (
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <p className="text-sm text-gray-400 text-center">
            Upgrade for unlimited usage
          </p>
        </div>
      )}
    </div>
  );
}
