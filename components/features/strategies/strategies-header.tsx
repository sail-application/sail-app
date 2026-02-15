/**
 * components/features/strategies/strategies-header.tsx
 *
 * Server Component — page header for the Methodologies Library.
 * Shows title, subtitle, and total methodology count.
 */

import { BookOpen } from 'lucide-react';

interface StrategiesHeaderProps {
  total: number;
}

export function StrategiesHeader({ total }: StrategiesHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-600">
        <BookOpen className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Methodologies Library
        </h2>
        <p className="text-sm text-foreground/60">
          {total} sales methodologies to explore and master
        </p>
      </div>
    </div>
  );
}
