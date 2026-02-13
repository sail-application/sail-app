/**
 * app/(dashboard)/email/page.tsx — Email Composition placeholder.
 *
 * Server Component placeholder for the Email Composition feature.
 * Displays the feature name, icon, and "Coming soon" message.
 * Will be replaced with AI-assisted prospect outreach drafting
 * using Gemini Pro for high-quality email generation.
 */

import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

export const metadata: Metadata = {
  title: 'Email Composition',
};

/** EmailPage — Placeholder for the AI-assisted email drafting feature. */
export default function EmailPage() {
  return (
    <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-600 mb-4">
        <Mail className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Email Composition</h2>
      <p className="text-foreground/60 max-w-md">
        AI-assisted prospect outreach drafting for effective sales emails. Coming soon.
      </p>
    </GlassPanel>
  );
}
