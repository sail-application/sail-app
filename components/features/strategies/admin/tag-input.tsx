/**
 * components/features/strategies/admin/tag-input.tsx
 *
 * Client Component — tag chip input for methodology admin forms.
 * Allows adding/removing string tags with Enter key or button.
 */

'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function TagInput({ value, onChange, label, placeholder = 'Add tag…' }: TagInputProps) {
  const [input, setInput] = useState('');

  /** Add tag on Enter key */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addTag();
  }

  function addTag() {
    const tag = input.trim().toLowerCase();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-foreground/80">{label}</label>}

      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/5 border border-[var(--glass-border)] min-h-[2.5rem]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-brand-900"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none"
        />
      </div>
    </div>
  );
}
