/**
 * app/(admin)/page.tsx — Admin dashboard home page.
 *
 * Server Component that shows an overview of admin functions as a
 * grid of glass cards. Each card links to a specific admin sub-page.
 * All sub-pages are "Coming soon" placeholders during MVP.
 *
 * Admin sections:
 *   - AI Providers — Configure which AI model each feature uses
 *   - Cost Dashboard — Token usage and spend tracking
 *   - User Management — Manage authorized members and roles
 *   - Audit Log — View system and user activity logs
 *   - Webhooks — Configure and monitor webhook endpoints
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Cpu,
  DollarSign,
  Users,
  FileText,
  Webhook,
  BookOpen,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

/** Admin section definitions for the card grid */
const adminSections = [
  {
    title: 'Methodologies',
    description: 'Manage sales methodologies, techniques, and AI coaching content.',
    href: '/admin/strategies',
    icon: BookOpen,
    ready: true,
  },
  {
    title: 'AI Providers',
    description: 'Configure AI models per feature (Gemini, Claude, OpenAI, DeepSeek).',
    href: '/ai-providers',
    icon: Cpu,
  },
  {
    title: 'Cost Dashboard',
    description: 'Monitor token usage, API spend, and cost per feature.',
    href: '/cost-dashboard',
    icon: DollarSign,
  },
  {
    title: 'User Management',
    description: 'Manage authorized members, roles, and Skool sync.',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Audit Log',
    description: 'View system events, user activity, and security logs.',
    href: '/audit-log',
    icon: FileText,
  },
  {
    title: 'Webhooks',
    description: 'Configure and monitor inbound/outbound webhook endpoints.',
    href: '/webhooks',
    icon: Webhook,
  },
] as const satisfies ReadonlyArray<{
  title: string; description: string; href: string;
  icon: typeof Cpu; ready?: boolean;
}>;

/** AdminPage — The admin dashboard with a grid of section cards. */
export default function AdminPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="mt-1 text-foreground/60">
          Manage AI providers, costs, users, and system configuration.
        </p>
      </div>

      {/* Admin section cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full p-0 transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                  {'ready' in section && section.ready ? null : (
                    <span className="inline-block mt-2 text-xs text-foreground/40 bg-foreground/5 px-2 py-0.5 rounded">
                      Coming soon
                    </span>
                  )}
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
