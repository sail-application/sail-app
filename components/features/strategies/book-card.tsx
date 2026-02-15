/**
 * components/features/strategies/book-card.tsx
 *
 * Server Component — book reference card.
 * Shows title, author, year, and optional link.
 */

import { BookOpen, ExternalLink } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import type { MethodologyBook } from '@/types/methodology';

interface BookCardProps {
  book: MethodologyBook;
}

export function BookCard({ book }: BookCardProps) {
  const Wrapper = book.url ? 'a' : 'div';
  const linkProps = book.url
    ? { href: book.url, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  return (
    <Wrapper {...linkProps} className="group block">
      <GlassPanel blur="light" className="p-4 transition-all group-hover:shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{book.title}</h4>
            <p className="text-xs text-foreground/60 mt-0.5">
              by {book.author}
              {book.year && ` (${book.year})`}
            </p>
          </div>
          {book.url && (
            <ExternalLink className="h-4 w-4 text-foreground/30 shrink-0" />
          )}
        </div>
      </GlassPanel>
    </Wrapper>
  );
}
