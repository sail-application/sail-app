/**
 * Button — Primary interactive button component for SAIL.
 *
 * A glassmorphism-themed button with multiple visual variants and sizes.
 * Uses class-variance-authority (CVA) for type-safe variant management.
 * Supports a loading state that displays an inline spinner and disables
 * interaction, preventing duplicate submissions during async operations.
 *
 * Variants:
 *   - default:     Solid brand-colored background (primary actions)
 *   - secondary:   Glass background with backdrop blur (secondary actions)
 *   - ghost:       Transparent background, text only (tertiary actions)
 *   - destructive: Red/error background (dangerous actions like delete)
 *   - outline:     Border only, no fill (subtle actions)
 *
 * Sizes: sm (compact), md (standard), lg (prominent)
 *
 * @example
 *   <Button variant="default" size="md" isLoading={isSaving}>
 *     Save Changes
 *   </Button>
 */
'use client';

import { type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { Spinner } from '@/components/ui/spinner';

/**
 * CVA definition for button styles.
 * The base styles handle layout, focus rings, transitions, and disabled state.
 * Each variant and size layer on top of the base.
 */
export const buttonVariants = cva(
  /* Base styles — shared across all variants */
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-xl font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer',
  ],
  {
    variants: {
      /** Visual style of the button */
      variant: {
        default: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-md',
        secondary: [
          'glass text-foreground',
          'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
          'shadow-[var(--glass-shadow)]',
          'hover:bg-white/20 active:bg-white/25',
        ],
        ghost: 'bg-transparent text-foreground hover:bg-white/10 active:bg-white/15',
        destructive: 'bg-error text-white hover:bg-red-700 active:bg-red-800 shadow-md',
        outline: [
          'border border-brand-500 text-brand-600 bg-transparent',
          'hover:bg-brand-50 active:bg-brand-100',
        ],
      },
      /** Controls height, padding, and font size */
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/** Props accepted by the Button component */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, shows a spinner and disables the button */
  isLoading?: boolean;
}

/**
 * Button component — the primary clickable element in SAIL's UI.
 * Renders a standard <button> with glassmorphism styling.
 */
export function Button({
  className,
  variant,
  size,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {/* Show spinner in place of content gap when loading */}
      {isLoading && <Spinner size="sm" className="shrink-0" />}
      {children}
    </button>
  );
}
