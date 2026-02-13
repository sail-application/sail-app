/**
 * app/(dashboard)/practice/page.tsx — Practice Mode placeholder.
 *
 * Server Component placeholder for the Practice Mode feature.
 * Displays the feature name, icon, and "Coming soon" message.
 * Will be replaced with AI roleplay, click-to-talk, split-screen
 * coach tips, and 10-level progression system.
 */

import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

export const metadata: Metadata = {
  title: 'Practice Mode',
};

/** PracticePage — Placeholder for the AI roleplay training feature. */
export default function PracticePage() {
  return (
    <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-600 mb-4">
        <GraduationCap className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Practice Mode</h2>
      <p className="text-foreground/60 max-w-md">
        AI-powered roleplay sessions with coaching tips and progress tracking. Coming soon.
      </p>
    </GlassPanel>
  );
}
