/**
 * app/(dashboard)/page.tsx — Dashboard home page.
 *
 * Server Component that shows a welcome message and a grid of
 * feature cards for the 6 core SAIL features. Each card links
 * to its respective feature page with an icon, name, and brief
 * description.
 *
 * The user's name is fetched from the Supabase session on the server.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  GraduationCap,
  Mail,
  BarChart3,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

/** Page metadata — "Dashboard | SAIL" in the browser tab */
export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Feature card data — defines the 6 core SAIL features.
 * Each entry maps to a card in the dashboard grid.
 */
const features = [
  {
    title: 'Live Call Assistant',
    description: 'Real-time coaching during active conversations with sub-2s latency.',
    href: '/dashboard/live-call',
    icon: Phone,
  },
  {
    title: 'Practice Mode',
    description: 'AI roleplay sessions with coaching tips and 10-level progress.',
    href: '/dashboard/practice',
    icon: GraduationCap,
  },
  {
    title: 'Email Composition',
    description: 'AI-assisted prospect outreach drafting for effective emails.',
    href: '/dashboard/email',
    icon: Mail,
  },
  {
    title: 'Call Analyzer',
    description: 'Upload call recordings for scorecards and improvement suggestions.',
    href: '/dashboard/analyzer',
    icon: BarChart3,
  },
  {
    title: 'Strategies Library',
    description: 'Browse and manage your active coaching strategies and techniques.',
    href: '/dashboard/strategies',
    icon: BookOpen,
  },
  {
    title: 'Dashboard Overview',
    description: 'Unified progress tracking, activity feed, and key metrics.',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
] as const;

/**
 * DashboardPage — The main dashboard view with welcome message and feature grid.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* Extract first name for the welcome message */
  const fullName = user?.user_metadata?.full_name || user?.email || 'there';
  const firstName = fullName.split(' ')[0].split('@')[0];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h2>
        <p className="mt-1 text-foreground/60">
          Choose a feature below to get started.
        </p>
      </div>

      {/* Feature cards grid — responsive from 1 to 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href} className="group">
              <Card className="h-full p-0 transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
