/**
 * GlassPanel — An opinionated glassmorphism container for SAIL.
 *
 * Unlike Card (which is a composable system with header/content/footer),
 * GlassPanel is a single self-contained container that wraps any content
 * in the full glassmorphism effect. It provides a configurable blur
 * intensity for different UI contexts:
 *
 *   - light:   Subtle blur — good for layered/nested panels
 *   - default: Standard blur — the primary glass look
 *   - heavy:   Strong blur — for overlays or high-contrast backgrounds
 *
 * Uses the CSS custom properties --glass-bg, --glass-border, and
 * --glass-shadow so theming changes propagate automatically.
 *
 * @example
 *   <GlassPanel blur="heavy" className="p-8">
 *     <h2>Live Call Assistant</h2>
 *     <p>Real-time coaching suggestions appear here.</p>
 *   </GlassPanel>
 */

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/** Maps the blur prop to the corresponding Tailwind backdrop-blur class */
const blurMap = {
  light: 'backdrop-blur-sm',
  default: 'backdrop-blur-md',
  heavy: 'backdrop-blur-lg',
} as const;

/** Props for the GlassPanel component */
export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the intensity of the backdrop blur effect.
   * - light:   backdrop-blur-sm (4px)
   * - default: backdrop-blur-md (12px)
   * - heavy:   backdrop-blur-lg (16px)
   */
  blur?: keyof typeof blurMap;
}

/**
 * GlassPanel — A full glassmorphism container with configurable blur.
 * Renders a div with translucent background, blur, border, and shadow.
 */
export function GlassPanel({
  blur = 'default',
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        'bg-[var(--glass-bg)]',
        'border border-[var(--glass-border)]',
        'shadow-[var(--glass-shadow)]',
        blurMap[blur],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
