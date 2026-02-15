/**
 * components/features/strategies/admin/methodology-table.tsx
 *
 * Server Component — admin table listing all methodologies.
 * Shows name, author, category, technique count, status, sort order.
 */

import Link from 'next/link';
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

export function MethodologyTable({ methodologies, techniqueCounts }: MethodologyTableProps) {
  if (methodologies.length === 0) {
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
              <th className="text-left px-4 py-3 font-medium text-foreground/60">Name</th>
              <th className="text-left px-4 py-3 font-medium text-foreground/60">Author</th>
              <th className="text-left px-4 py-3 font-medium text-foreground/60">Category</th>
              <th className="text-center px-4 py-3 font-medium text-foreground/60">Techniques</th>
              <th className="text-center px-4 py-3 font-medium text-foreground/60">Tier</th>
              <th className="text-center px-4 py-3 font-medium text-foreground/60">Order</th>
              <th className="text-center px-4 py-3 font-medium text-foreground/60">Status</th>
              <th className="text-right px-4 py-3 font-medium text-foreground/60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {methodologies.map((m) => (
              <tr key={m.id} className="border-b border-foreground/5 hover:bg-foreground/3">
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
                <td className="px-4 py-3 text-center text-foreground/50">{m.sort_order}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={m.is_active ? 'success' : 'warning'}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </Badge>
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
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
