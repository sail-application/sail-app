/**
 * components/features/strategies/admin/book-fields.tsx
 *
 * Client Component — dynamic list of book reference inputs.
 * Add/remove book entries (title, author, ISBN, URL, year, cover URL).
 */

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { MethodologyBook } from '@/types/methodology';

interface BookFieldsProps {
  value: MethodologyBook[];
  onChange: (books: MethodologyBook[]) => void;
}

const EMPTY_BOOK: MethodologyBook = { title: '', author: '' };

export function BookFields({ value, onChange }: BookFieldsProps) {
  function addBook() {
    onChange([...value, { ...EMPTY_BOOK }]);
  }

  function removeBook(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateBook(idx: number, field: keyof MethodologyBook, val: string | number) {
    const updated = value.map((b, i) => (i === idx ? { ...b, [field]: val } : b));
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/80">Books</label>
        <Button type="button" variant="ghost" size="sm" onClick={addBook}>
          <Plus className="h-4 w-4" /> Add Book
        </Button>
      </div>

      {value.map((book, idx) => (
        <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-white/5 border border-[var(--glass-border)]">
          <Input
            placeholder="Book title"
            value={book.title}
            onChange={(e) => updateBook(idx, 'title', e.target.value)}
          />
          <Input
            placeholder="Author name"
            value={book.author}
            onChange={(e) => updateBook(idx, 'author', e.target.value)}
          />
          <Input
            placeholder="ISBN (optional)"
            value={book.isbn ?? ''}
            onChange={(e) => updateBook(idx, 'isbn', e.target.value)}
          />
          <Input
            placeholder="URL (optional)"
            value={book.url ?? ''}
            onChange={(e) => updateBook(idx, 'url', e.target.value)}
          />
          <Input
            placeholder="Cover image URL (optional)"
            value={book.cover_url ?? ''}
            onChange={(e) => updateBook(idx, 'cover_url', e.target.value)}
          />
          <div className="flex gap-2 items-end">
            <Input
              type="number"
              placeholder="Year"
              value={book.year ?? ''}
              onChange={(e) => updateBook(idx, 'year', parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeBook(idx)}
              aria-label="Remove book"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}

      {value.length === 0 && (
        <p className="text-sm text-foreground/40 text-center py-2">No books added yet.</p>
      )}
    </div>
  );
}
