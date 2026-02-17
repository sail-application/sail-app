'use client';

/**
 * components/features/shared/session-config-manager.tsx
 *
 * Save / load session configurations (methodology + context pack presets).
 * Fetches configs on mount. Lets users:
 *   - Load a saved config (restores methodology IDs + context pack)
 *   - Save the current setup with a name + optional "set as default" flag
 *   - Delete a config (with inline confirmation)
 *
 * Used by: SessionSetup (practice) and CallSetup (live-call).
 */

import { useState, useEffect } from 'react';
import { Bookmark, Trash2, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionConfig {
  id: string;
  name: string;
  session_type: string;
  methodology_ids: string[];
  context_pack_id: string | null;
  is_default: boolean;
}

interface SessionConfigManagerProps {
  sessionType: 'practice' | 'live-call';
  currentMethodologyIds: string[];
  currentContextPackId: string | null;
  onLoadConfig: (methodologyIds: string[], contextPackId: string | null) => void;
}

/**
 * SessionConfigManager — Compact save/load widget for session presets.
 * Renders above the methodology selector in setup forms.
 */
export function SessionConfigManager({
  sessionType,
  currentMethodologyIds,
  currentContextPackId,
  onLoadConfig,
}: SessionConfigManagerProps) {
  const [configs, setConfigs] = useState<SessionConfig[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Fetch configs on mount
  useEffect(() => {
    void fetchConfigs();
  }, [sessionType]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchConfigs() {
    try {
      const res = await fetch(`/api/session-configs?sessionType=${sessionType}`);
      if (res.ok) {
        const { configs: data } = await res.json();
        setConfigs(data ?? []);
      }
    } catch { /* silent */ }
  }

  async function handleSave() {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/session-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          session_type: sessionType,
          methodology_ids: currentMethodologyIds,
          context_pack_id: currentContextPackId,
          is_default: saveAsDefault,
        }),
      });
      if (res.ok) {
        setSaveName('');
        setSaveAsDefault(false);
        setShowSaveForm(false);
        await fetchConfigs();
      }
    } catch { /* silent */ } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/session-configs?id=${id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      await fetchConfigs();
    } catch { /* silent */ }
  }

  function handleLoad(config: SessionConfig) {
    onLoadConfig(config.methodology_ids, config.context_pack_id);
    setIsOpen(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/80">Saved Configurations</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSaveForm((v) => !v)}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <Bookmark className="h-3 w-3" />
            Save current
          </Button>
          {configs.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen((v) => !v)}
              className="h-7 gap-1.5 px-2 text-xs"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              Load ({configs.length})
            </Button>
          )}
        </div>
      </div>

      {/* Save form */}
      {showSaveForm && (
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 space-y-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Config name (e.g., 'Cold Call — Real Estate')"
            maxLength={100}
            className="w-full rounded border border-foreground/20 bg-transparent px-2 py-1 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand-600/50"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-foreground/60 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                className="rounded"
              />
              Set as default
            </label>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!saveName.trim() || isSaving}
              className="h-6 px-2 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Config list */}
      {isOpen && configs.length > 0 && (
        <div className="rounded-lg border border-foreground/10 bg-foreground/5 divide-y divide-foreground/5">
          {configs.map((config) => (
            <div key={config.id} className="flex items-center justify-between px-3 py-2">
              <button
                type="button"
                onClick={() => handleLoad(config)}
                className="flex-1 text-left text-sm hover:text-brand-600 transition-colors"
              >
                {config.name}
                {config.is_default && (
                  <span className="ml-2 text-xs text-brand-600 font-medium">default</span>
                )}
              </button>
              {confirmDeleteId === config.id ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void handleDelete(config.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-foreground/50 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(config.id)}
                  className="text-foreground/30 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
