/**
 * ProgressBar — Animated progress indicator for SAIL.
 *
 * Displays a horizontal bar that fills from left to right based on
 * a 0-100 value. The track uses a glass background and the fill bar
 * uses semantic colors to indicate status. Supports an optional
 * label and percentage display.
 *
 * Variants:
 *   - default: Brand color fill (general progress)
 *   - success: Green fill (completed/positive)
 *   - warning: Amber fill (approaching limit/caution)
 *   - error:   Red fill (critical/over limit)
 *
 * The fill width animates smoothly via CSS transition-all when the
 * value changes, providing visual feedback for progress updates.
 *
 * @example
 *   <ProgressBar value={73} label="Call Score" showPercentage />
 *   <ProgressBar value={100} variant="success" label="Complete" />
 */

import { cn } from '@/lib/utils/cn';

/** Maps variant names to their Tailwind background color classes */
const variantColors = {
  default: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
} as const;

/** Props accepted by the ProgressBar component */
export interface ProgressBarProps {
  /** Progress value from 0 to 100 */
  value: number;
  /** Optional text label displayed above the bar */
  label?: string;
  /** When true, shows the numeric percentage next to the label */
  showPercentage?: boolean;
  /** Color variant for the fill bar */
  variant?: keyof typeof variantColors;
  /** Additional CSS classes for the outer container */
  className?: string;
}

/**
 * ProgressBar component — a glass-track bar with colored fill.
 * Clamps the value to 0-100 to prevent visual overflow.
 */
export function ProgressBar({
  value,
  label,
  showPercentage = false,
  variant = 'default',
  className,
}: ProgressBarProps) {
  /** Clamp to valid percentage range to prevent overflow */
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {/* Label row — shows label text and/or percentage */}
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-foreground/80">{label}</span>
          )}
          {showPercentage && (
            <span className="tabular-nums text-foreground/60">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Track — glass-styled background bar */}
      <div
        className={cn(
          'h-2.5 w-full overflow-hidden rounded-full',
          'bg-[var(--glass-bg)] border border-[var(--glass-border)]'
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* Fill — the colored portion that represents progress */}
        <div
          className={cn(
            'h-full rounded-full',
            'transition-all duration-500 ease-out',
            variantColors[variant]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
