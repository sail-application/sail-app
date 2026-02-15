/**
 * components/features/strategies/admin/video-fields.tsx
 *
 * Client Component — dynamic list of video reference inputs.
 * Add/remove video entries (title, URL, duration, description).
 */

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { MethodologyVideo } from '@/types/methodology';

interface VideoFieldsProps {
  value: MethodologyVideo[];
  onChange: (videos: MethodologyVideo[]) => void;
}

const EMPTY_VIDEO: MethodologyVideo = { title: '', url: '' };

export function VideoFields({ value, onChange }: VideoFieldsProps) {
  function addVideo() {
    onChange([...value, { ...EMPTY_VIDEO }]);
  }

  function removeVideo(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateVideo(idx: number, field: keyof MethodologyVideo, val: string) {
    const updated = value.map((v, i) => (i === idx ? { ...v, [field]: val } : v));
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/80">Videos</label>
        <Button type="button" variant="ghost" size="sm" onClick={addVideo}>
          <Plus className="h-4 w-4" /> Add Video
        </Button>
      </div>

      {value.map((video, idx) => (
        <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-white/5 border border-[var(--glass-border)]">
          <Input
            placeholder="Video title"
            value={video.title}
            onChange={(e) => updateVideo(idx, 'title', e.target.value)}
          />
          <Input
            placeholder="https://youtube.com/..."
            value={video.url}
            onChange={(e) => updateVideo(idx, 'url', e.target.value)}
          />
          <Input
            placeholder="Duration (e.g. 12:34)"
            value={video.duration ?? ''}
            onChange={(e) => updateVideo(idx, 'duration', e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Description (optional)"
              value={video.description ?? ''}
              onChange={(e) => updateVideo(idx, 'description', e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeVideo(idx)}
              aria-label="Remove video"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}

      {value.length === 0 && (
        <p className="text-sm text-foreground/40 text-center py-2">No videos added yet.</p>
      )}
    </div>
  );
}
