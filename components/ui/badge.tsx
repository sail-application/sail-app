/**
 * Badge — Small status/label pill component for SAIL.
 *
 * Displays a compact rounded-full pill used for status indicators,
 * tags, counts, and labels. Uses class-variance-authority for
 * type-safe variant management with semantic color options.
 *
 * Variants:
 *   - default: Brand color (general-purpose label)
 *   - success: Green (completed, passed, active)
 *   - warning: Amber (attention needed, in-progress)
 *   - error:   Red (failed, blocked, critical)
 *   - info:    Blue (informational, neutral highlight)
 *
 * @example
 *   <Badge variant="success">Active</Badge>
 *   <Badge variant="warning">In Progress</Badge>
 *   <Badge variant="error">Failed</Badge>
 */

import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * CVA definition for badge styles.
 * Base styles handle the pill shape, sizing, and font.
 * Variants control background and text colors using semantic tokens.
 */
export const badgeVariants = cva(
  /* Base — small rounded pill */
  [
    'inline-flex items-center justify-center',
    'rounded-full px-2.5 py-0.5',
    'text-xs font-medium leading-none',
    'whitespace-nowrap',
  ],
  {
    variants: {
      /** Semantic color variant */
      variant: {
        default: 'bg-brand-100 text-brand-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/** Props accepted by the Badge component */
export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component — a small pill-shaped label.
 * Renders a <span> with semantic coloring based on variant.
 */
export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  );
}
