/**
 * components/features/strategies/methodology-grid-interactive.tsx
 *
 * Client Component — user-facing methodology grid with drag-and-drop
 * reordering and enable/disable toggles for personal prioritization.
 * Persists changes via the preferences API.
 */

'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { MethodologyCardInteractive } from './methodology-card-interactive';
import type { MethodologyListItem, UserMethodologyPreference } from '@/types/methodology';

interface MethodologyGridInteractiveProps {
  methodologies: MethodologyListItem[];
  techniqueCounts: Record<string, number>;
  preferences: UserMethodologyPreference[];
}

/** Merge server sort_order with user overrides and return ordered list */
function mergeAndSort(
  methodologies: MethodologyListItem[],
  preferences: UserMethodologyPreference[],
) {
  const prefMap = new Map(preferences.map((p) => [p.methodology_id, p]));

  return [...methodologies].sort((a, b) => {
    const prefA = prefMap.get(a.id);
    const prefB = prefMap.get(b.id);
    // User sort_order overrides; if 0 or null, fall back to server sort_order
    const orderA = prefA?.sort_order || a.sort_order;
    const orderB = prefB?.sort_order || b.sort_order;
    return orderA - orderB;
  });
}

export function MethodologyGridInteractive({
  methodologies: initial,
  techniqueCounts,
  preferences: initialPrefs,
}: MethodologyGridInteractiveProps) {
  const [items, setItems] = useState(() => mergeAndSort(initial, initialPrefs));
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    // Default all to enabled, then override with user prefs
    initial.forEach((m) => { map[m.id] = true; });
    initialPrefs.forEach((p) => { map[p.methodology_id] = p.is_enabled; });
    return map;
  });

  /* ── Toggle enable/disable ── */
  const handleToggle = useCallback(async (methodologyId: string, newEnabled: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [methodologyId]: newEnabled }));

    try {
      const res = await fetch('/api/methodologies/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodology_id: methodologyId, is_enabled: newEnabled }),
      });
      if (!res.ok) throw new Error('Toggle failed');
    } catch {
      // Revert on failure
      setEnabledMap((prev) => ({ ...prev, [methodologyId]: !newEnabled }));
    }
  }, []);

  /* ── Drag-and-drop reorder ── */
  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;

    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered);

    // Persist new sort order
    const payload = reordered.map((m, i) => ({ methodology_id: m.id, sort_order: i }));

    try {
      await fetch('/api/methodologies/preferences/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });
    } catch {
      // Revert on failure
      setItems(items);
    }
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-foreground/50">
        <p className="text-lg font-medium mb-1">No methodologies found</p>
        <p className="text-sm">Try adjusting your search or filter.</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="user-methodology-grid" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {items.map((m, index) => (
              <Draggable key={m.id} draggableId={m.id} index={index}>
                {(drag) => (
                  <div ref={drag.innerRef} {...drag.draggableProps}>
                    <MethodologyCardInteractive
                      methodology={m}
                      techniqueCount={techniqueCounts[m.id] ?? 0}
                      isEnabled={enabledMap[m.id] ?? true}
                      onToggle={handleToggle}
                      dragHandleProps={drag.dragHandleProps}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
