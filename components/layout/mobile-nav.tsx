/**
 * components/layout/mobile-nav.tsx — Bottom navigation bar for mobile.
 *
 * Fixed to the bottom of the viewport on screens smaller than md (768px).
 * Hidden on desktop where the Sidebar provides navigation instead.
 *
 * Shows 5 navigation items: the 4 most-used features plus a "More"
 * button that reveals a dropdown with the remaining links.
 *
 * Uses glassmorphism background and active-state highlighting
 * consistent with the rest of the SAIL design system.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Phone,
  GraduationCap,
  Mail,
  MoreHorizontal,
  BarChart3,
  BookOpen,
  Settings,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Primary nav items shown directly in the bottom bar */
const primaryItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Call', href: '/dashboard/live-call', icon: Phone },
  { label: 'Practice', href: '/dashboard/practice', icon: GraduationCap },
  { label: 'Email', href: '/dashboard/email', icon: Mail },
] as const;

/** Overflow items shown when "More" is tapped */
const overflowItems = [
  { label: 'Analyzer', href: '/dashboard/analyzer', icon: BarChart3 },
  { label: 'Strategies', href: '/dashboard/strategies', icon: BookOpen },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
] as const;

/** Checks if a nav item is currently active */
function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

interface MobileNavProps {
  /** When true, shows an Admin link in the overflow menu */
  isAdmin?: boolean;
}

/**
 * MobileNav — Bottom navigation bar for small screens.
 * Manages the "More" dropdown open/close state internally.
 */
export function MobileNav({ isAdmin }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  /** Close the "More" dropdown when tapping outside of it */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    if (moreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  /** Build the full overflow list — add Admin link if user has admin role */
  const allOverflowItems = [
    ...overflowItems,
    ...(isAdmin ? [{ label: 'Admin', href: '/admin', icon: Shield }] as const : []),
  ];

  /** Check if any overflow item is active (to highlight the "More" button) */
  const overflowActive = allOverflowItems.some((item) => isActive(item.href, pathname));

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'glass border-t border-[var(--glass-border)]',
        'px-2 pb-[env(safe-area-inset-bottom)]'
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around py-2">
        {/* Primary nav items */}
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl',
                'text-xs font-medium transition-colors duration-150',
                active ? 'text-brand-600' : 'text-foreground/50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More button with dropdown */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl',
              'text-xs font-medium transition-colors duration-150 cursor-pointer',
              overflowActive ? 'text-brand-600' : 'text-foreground/50'
            )}
            aria-label="More navigation options"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>

          {/* Overflow dropdown menu */}
          {moreOpen && (
            <div
              className={cn(
                'absolute bottom-full right-0 mb-2 min-w-[160px]',
                'glass rounded-xl p-2',
                'animate-in fade-in slide-in-from-bottom-2 duration-200'
              )}
            >
              {allOverflowItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5',
                      'text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-brand-600/15 text-brand-600'
                        : 'text-foreground/60 hover:bg-white/10'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
