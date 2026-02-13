/**
 * Spinner — Animated loading indicator for SAIL.
 *
 * A simple CSS-only spinning circle used to indicate that an
 * operation is in progress. Uses a border-based technique: a
 * circular element with a colored border on three sides and a
 * transparent top border, rotated via CSS animation.
 *
 * Sizes:
 *   - sm: 16x16px (inline with text, used in Button loading state)
 *   - md: 24x24px (standard loading indicator)
 *   - lg: 32x32px (page-level or section-level loading)
 *
 * The spinner uses brand-500 as its color so it matches the
 * overall SAIL design theme.
 *
 * @example
 *   <Spinner />
 *   <Spinner size="lg" className="text-white" />
 */

import { cn } from '@/lib/utils/cn';

/** Maps size names to Tailwind width/height and border-width classes */
const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
} as const;

/** Props accepted by the Spinner component */
export interface SpinnerProps {
  /** Controls the diameter and border thickness of the spinner */
  size?: keyof typeof sizeClasses;
  /** Additional CSS classes (e.g., to override the spinner color) */
  className?: string;
}

/**
 * Spinner component — a rotating circle loading indicator.
 * Uses the animate-spin utility from Tailwind for the rotation
 * and a transparent top border to create the spinning arc effect.
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        'border-brand-500 border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {/* Visually hidden text for screen readers */}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
