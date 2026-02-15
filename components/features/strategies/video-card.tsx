/**
 * components/features/strategies/video-card.tsx
 *
 * Client Component — video reference card with lazy YouTube embed.
 * Shows video title and description, links out to YouTube.
 */

'use client';

import { ExternalLink, Play } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import type { MethodologyVideo } from '@/types/methodology';

interface VideoCardProps {
  video: MethodologyVideo;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <GlassPanel blur="light" className="p-4 transition-all group-hover:shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
            <Play className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm group-hover:text-brand-600 transition-colors">
              {video.title}
            </h4>
            {video.description && (
              <p className="text-xs text-foreground/60 mt-1 line-clamp-2">
                {video.description}
              </p>
            )}
            {video.duration && (
              <p className="text-xs text-foreground/40 mt-1">{video.duration}</p>
            )}
          </div>
          <ExternalLink className="h-4 w-4 text-foreground/30 shrink-0" />
        </div>
      </GlassPanel>
    </a>
  );
}
