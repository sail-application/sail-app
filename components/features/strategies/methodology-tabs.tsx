/**
 * components/features/strategies/methodology-tabs.tsx
 *
 * Client Component — tabbed content for methodology detail page.
 * Tabs: Overview | Techniques | Videos | Books
 */

'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { TechniqueList } from './technique-list';
import { VideoCard } from './video-card';
import { BookCard } from './book-card';
import type { Methodology, MethodologyVideo, MethodologyBook } from '@/types/methodology';
import type { Strategy } from '@/types/database';

interface MethodologyTabsProps {
  methodology: Methodology;
  strategies: Strategy[];
}

type TabKey = 'overview' | 'techniques' | 'videos' | 'books';

export function MethodologyTabs({ methodology: m, strategies }: MethodologyTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const videos = (m.videos ?? []) as MethodologyVideo[];
  const books = (m.books ?? []) as MethodologyBook[];

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'techniques', label: 'Techniques', count: strategies.length },
    { key: 'videos', label: 'Videos', count: videos.length },
    { key: 'books', label: 'Books', count: books.length },
  ];

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-1 border-b border-foreground/10" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-foreground/50 hover:text-foreground/80'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs text-foreground/40">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'overview' && <OverviewTab methodology={m} />}
        {activeTab === 'techniques' && <TechniqueList strategies={strategies} />}
        {activeTab === 'videos' && <VideosTab videos={videos} />}
        {activeTab === 'books' && <BooksTab books={books} />}
      </div>
    </div>
  );
}

/** Overview tab content */
function OverviewTab({ methodology: m }: { methodology: Methodology }) {
  return (
    <div className="space-y-4">
      <GlassPanel blur="light" className="p-5">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-sm text-foreground/80 whitespace-pre-line">{m.description}</p>
      </GlassPanel>

      {m.how_it_works && (
        <GlassPanel blur="light" className="p-5">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <p className="text-sm text-foreground/80 whitespace-pre-line">{m.how_it_works}</p>
        </GlassPanel>
      )}

      {m.best_for && (
        <GlassPanel blur="light" className="p-5">
          <h3 className="font-semibold mb-2">Best For</h3>
          <p className="text-sm text-foreground/80 whitespace-pre-line">{m.best_for}</p>
        </GlassPanel>
      )}
    </div>
  );
}

/** Videos tab content */
function VideosTab({ videos }: { videos: MethodologyVideo[] }) {
  if (videos.length === 0) {
    return <p className="text-center py-8 text-foreground/50">No videos yet.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {videos.map((video, i) => (
        <VideoCard key={i} video={video} />
      ))}
    </div>
  );
}

/** Books tab content */
function BooksTab({ books }: { books: MethodologyBook[] }) {
  if (books.length === 0) {
    return <p className="text-center py-8 text-foreground/50">No books yet.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {books.map((book, i) => (
        <BookCard key={i} book={book} />
      ))}
    </div>
  );
}
