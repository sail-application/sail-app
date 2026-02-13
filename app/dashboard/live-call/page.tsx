/**
 * app/(dashboard)/live-call/page.tsx — Live Call Assistant placeholder.
 *
 * Server Component placeholder for the Live Call Assistant feature.
 * Displays the feature name, icon, and "Coming soon" message inside
 * a glass panel. Will be replaced with the full real-time coaching
 * interface (Gemini Flash, Web Speech API, sub-2s latency).
 */

import type { Metadata } from 'next';
import { Phone } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

export const metadata: Metadata = {
  title: 'Live Call Assistant',
};

/** LiveCallPage — Placeholder for the real-time call coaching feature. */
export default function LiveCallPage() {
  return (
    <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-600 mb-4">
        <Phone className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Live Call Assistant</h2>
      <p className="text-foreground/60 max-w-md">
        Real-time coaching during active sales calls. Coming soon.
      </p>
    </GlassPanel>
  );
}
