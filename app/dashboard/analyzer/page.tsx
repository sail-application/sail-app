/**
 * app/(dashboard)/analyzer/page.tsx — Call Analyzer placeholder.
 *
 * Server Component placeholder for the Call Analyzer feature.
 * Displays the feature name, icon, and "Coming soon" message.
 * Will be replaced with post-call upload, AI scorecards, and
 * improvement suggestions powered by Gemini Pro.
 */

import type { Metadata } from 'next';
import { BarChart3 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

export const metadata: Metadata = {
  title: 'Call Analyzer',
};

/** AnalyzerPage — Placeholder for the post-call analysis feature. */
export default function AnalyzerPage() {
  return (
    <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-600 mb-4">
        <BarChart3 className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Call Analyzer</h2>
      <p className="text-foreground/60 max-w-md">
        Upload call recordings for AI-generated scorecards and improvement suggestions. Coming soon.
      </p>
    </GlassPanel>
  );
}
