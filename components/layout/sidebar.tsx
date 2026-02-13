/**
 * components/layout/sidebar.tsx — Dashboard sidebar navigation.
 *
 * Renders the main navigation for the SAIL dashboard. Shows the SAIL
 * logo at the top, navigation links for all 6 core features in the
 * middle, and a Settings link pinned to the bottom.
 *
 * Features:
 *   - Highlights the active link based on the current URL pathname
 *   - Collapsible: toggling collapses to icon-only mode for more space
 *   - Glassmorphism background consistent with SAIL design language
 *   - Hidden on mobile (replaced by MobileNav bottom bar)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Phone,
  GraduationCap,
  Mail,
  BarChart3,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Navigation item definition.
 * Each entry maps a label, route path, and icon to a sidebar link.
 */
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Live Call', href: '/dashboard/live-call', icon: Phone },
  { label: 'Practice', href: '/dashboard/practice', icon: GraduationCap },
  { label: 'Email', href: '/dashboard/email', icon: Mail },
  { label: 'Analyzer', href: '/dashboard/analyzer', icon: BarChart3 },
  { label: 'Strategies', href: '/dashboard/strategies', icon: BookOpen },
] as const;

/**
 * Checks if a nav item is currently active based on the pathname.
 * Dashboard link is only active on exact match; others use startsWith
 * so sub-routes still highlight their parent nav item.
 */
function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

/**
 * Sidebar — The main left-hand navigation panel for the dashboard.
 * Manages its own collapsed/expanded state via useState.
 */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0',
        'glass border-r border-[var(--glass-border)]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo section at the top */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--glass-border)]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
          S
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">SAIL</span>
        )}
      </div>

      {/* Main navigation links */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5',
                'text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-brand-600/15 text-brand-600'
                  : 'text-foreground/60 hover:bg-white/10 hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: Settings link and collapse toggle */}
      <div className="flex flex-col gap-1 px-2 py-4 border-t border-[var(--glass-border)]">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5',
            'text-sm font-medium transition-colors duration-150',
            isActive('/dashboard/settings', pathname)
              ? 'bg-brand-600/15 text-brand-600'
              : 'text-foreground/60 hover:bg-white/10 hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Collapse/expand toggle button */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5',
            'text-sm font-medium text-foreground/40',
            'hover:bg-white/10 hover:text-foreground/60',
            'transition-colors duration-150 cursor-pointer',
            collapsed && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
