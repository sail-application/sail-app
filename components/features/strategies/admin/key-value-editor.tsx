/**
 * components/features/strategies/admin/key-value-editor.tsx
 *
 * Client Component — reusable key-value pair editor.
 * Used for vocabulary and feature_prompt_overrides fields.
 * Allows adding, editing, and removing key-value rows.
 */

'use client';

import { useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface KeyValueEditorProps {
  label: string;
  value: Record<string, string>;
  onChange: (val: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  label,
  value,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  const entries = Object.entries(value);

  const handleKeyChange = useCallback((oldKey: string, newKey: string) => {
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      updated[k === oldKey ? newKey : k] = v;
    }
    onChange(updated);
  }, [value, onChange]);

  const handleValueChange = useCallback((key: string, newVal: string) => {
    onChange({ ...value, [key]: newVal });
  }, [value, onChange]);

  const handleAdd = useCallback(() => {
    // Find a unique key name
    let i = 1;
    let newKey = 'new_key';
    while (value[newKey] !== undefined) {
      newKey = `new_key_${i++}`;
    }
    onChange({ ...value, [newKey]: '' });
  }, [value, onChange]);

  const handleRemove = useCallback((key: string) => {
    const updated = { ...value };
    delete updated[key];
    onChange(updated);
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      {entries.length === 0 && (
        <p className="text-xs text-foreground/40 italic">No entries yet.</p>
      )}
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 items-center">
          <Input
            value={k}
            onChange={(e) => handleKeyChange(k, e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1"
          />
          <Input
            value={v}
            onChange={(e) => handleValueChange(k, e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-[2]"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(k)}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={handleAdd}>
        <Plus className="h-4 w-4 mr-1" />
        Add Entry
      </Button>
    </div>
  );
}
