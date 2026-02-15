/**
 * components/features/strategies/strategies-search.tsx
 *
 * Client Component — search bar + category pills + filter dropdowns.
 * Filters: Level (complexity), Author (creator), Access Tier (price).
 * Uses URL params for state so searches are shareable/bookmarkable.
 */

'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'framework', label: 'Frameworks' },
  { key: 'questioning', label: 'Questioning' },
  { key: 'process', label: 'Process' },
  { key: 'mindset', label: 'Mindset' },
];

const LEVELS = [
  { key: '', label: 'All Levels' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

const TIERS = [
  { key: '', label: 'All Tiers' },
  { key: 'free', label: 'Free' },
  { key: 'pro', label: 'Pro' },
  { key: 'team', label: 'Team' },
];

interface StrategiesSearchProps {
  /** Unique author names from the active methodologies — for the Author filter */
  authors?: string[];
}

export function StrategiesSearch({ authors = [] }: StrategiesSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') ?? '';
  const currentCategory = searchParams.get('category') ?? '';
  const currentLevel = searchParams.get('level') ?? '';
  const currentAuthor = searchParams.get('author') ?? '';
  const currentTier = searchParams.get('tier') ?? '';

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  /* Shared styles for filter dropdowns */
  const selectClass =
    'px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/30';

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <input
          type="text"
          placeholder="Search methodologies..."
          defaultValue={currentSearch}
          onChange={(e) => updateParams('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
          aria-label="Search methodologies"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            role="tab"
            aria-selected={currentCategory === cat.key}
            onClick={() => updateParams('category', cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              currentCategory === cat.key
                ? 'bg-brand-600 text-white'
                : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filter dropdowns row */}
      <div className="flex flex-wrap gap-2">
        {/* Level filter */}
        <select
          value={currentLevel}
          onChange={(e) => updateParams('level', e.target.value)}
          className={selectClass}
          aria-label="Filter by level"
        >
          {LEVELS.map((l) => (
            <option key={l.key} value={l.key}>{l.label}</option>
          ))}
        </select>

        {/* Author filter — dynamically populated from data */}
        <select
          value={currentAuthor}
          onChange={(e) => updateParams('author', e.target.value)}
          className={selectClass}
          aria-label="Filter by author"
        >
          <option value="">All Authors</option>
          {authors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Access tier filter */}
        <select
          value={currentTier}
          onChange={(e) => updateParams('tier', e.target.value)}
          className={selectClass}
          aria-label="Filter by access tier"
        >
          {TIERS.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
