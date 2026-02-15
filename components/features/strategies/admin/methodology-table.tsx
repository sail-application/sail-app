/**
 * components/features/strategies/admin/methodology-table.tsx
 *
 * Client Component — admin table listing all methodologies.
 * Supports drag-and-drop row reordering and active/inactive toggle.
 * Calls PUT /api/admin/methodologies/reorder on drag end,
 * and PUT /api/admin/methodologies/:id on toggle change.
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';

interface MethodologyRow {
  id: string;
  name: string;
  slug: string;
  author: string;
  category: string;
  complexity_level: string;
  access_tier: string;
  sort_order: number;
  is_active: boolean;
}

interface MethodologyTableProps {
  methodologies: MethodologyRow[];
  techniqueCounts: Record<string, number>;
}

export function MethodologyTable({ methodologies: initial, techniqueCounts }: MethodologyTableProps) {
  const [rows, setRows] = useState(initial);

  /* ── Toggle active/inactive ── */
  const handleToggle = useCallback(async (id: string, currentActive: boolean) => {
    const newActive = !currentActive;
    // Optimistic update
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: newActive } : r)));

    try {
      const res = await fetch(`/api/admin/methodologies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive }),
      });
      if (!res.ok) throw new Error('Toggle failed');
    } catch {
      // Revert on failure
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: currentActive } : r)));
    }
  }, []);

  /* ── Drag-and-drop reorder ── */
  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;

    const reordered = Array.from(rows);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Assign new sort_order values
    const updated = reordered.map((r, i) => ({ ...r, sort_order: i }));
    setRows(updated);

    try {
      await fetch('/api/admin/methodologies/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updated.map((r) => ({ id: r.id, sort_order: r.sort_order })) }),
      });
    } catch {
      // Revert on failure
      setRows(initial);
    }
  }, [rows, initial]);

  if (rows.length === 0) {
    return (
      <GlassPanel className="p-8 text-center text-foreground/50">
        No methodologies found. Create one to get started.
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10">
              <th className="w-10 px-2 py-3" />
              <th className="text-left px-4 py-3 font-medium text-foreground/60">Name</th>
              <th className="text-left px-4 py-3 font-medium text-foreground/60">Author</th>
              <th className="text-left px-4 py-3 font-medium text-foreground/60">Category</th>
              <th className="text-center px-4 py-3 font-medium text-foreground/60">Techniques</th>
              <th className="text-center px-4 py-3 font-medium text-foreground/60">Tier</th>
              <th className="text-center px-4 py-3 font-medium text-foreground/60">Active</th>
              <th className="text-right px-4 py-3 font-medium text-foreground/60">Actions</th>
            </tr>
          </thead>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="admin-methodology-table">
              {(provided) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {rows.map((m, index) => (
                    <Draggable key={m.id} draggableId={m.id} index={index}>
                      {(drag, snapshot) => (
                        <tr
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`border-b border-foreground/5 ${
                            snapshot.isDragging ? 'bg-foreground/5 shadow-lg' : 'hover:bg-foreground/3'
                          }`}
                          style={drag.draggableProps.style}
                        >
                          {/* Drag handle */}
                          <td className="w-10 px-2 py-3 text-center" {...drag.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-foreground/30 mx-auto cursor-grab" />
                          </td>
                          <td className="px-4 py-3 font-medium">{m.name}</td>
                          <td className="px-4 py-3 text-foreground/60">{m.author}</td>
                          <td className="px-4 py-3">
                            <Badge variant="default">{m.category}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">{techniqueCounts[m.id] ?? 0}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={m.access_tier === 'free' ? 'success' : 'info'}>
                              {m.access_tier}
                            </Badge>
                          </td>
                          {/* Toggle switch */}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={m.is_active}
                              onClick={() => handleToggle(m.id, m.is_active)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                m.is_active ? 'bg-emerald-500' : 'bg-foreground/20'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                  m.is_active ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/strategies/${m.id}`}
                              className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </DragDropContext>
        </table>
      </div>
    </GlassPanel>
  );
}
