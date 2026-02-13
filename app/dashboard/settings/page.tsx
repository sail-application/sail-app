/**
 * app/(dashboard)/settings/page.tsx — Settings placeholder.
 *
 * Server Component placeholder for the user Settings page.
 * Displays the feature name, icon, and "Coming soon" message.
 * Will be replaced with profile management, notification preferences,
 * theme settings, and account options.
 */

import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

export const metadata: Metadata = {
  title: 'Settings',
};

/** SettingsPage — Placeholder for user settings and preferences. */
export default function SettingsPage() {
  return (
    <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-600 mb-4">
        <Settings className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Settings</h2>
      <p className="text-foreground/60 max-w-md">
        Profile management, notification preferences, and account settings. Coming soon.
      </p>
    </GlassPanel>
  );
}
