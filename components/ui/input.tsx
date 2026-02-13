/**
 * Input — Glassmorphism-styled text input for SAIL.
 *
 * A form input component with translucent glass styling, focus ring,
 * optional label, and inline error messaging. Uses forwardRef so it
 * works seamlessly with form libraries (React Hook Form, etc.).
 *
 * Features:
 *   - Glass-styled: transparent background with glass border
 *   - Focus ring: brand-500 colored ring on focus
 *   - Error state: red border + error message displayed below
 *   - Label: optional label rendered above the input
 *   - Extends native InputHTMLAttributes for full HTML input compatibility
 *
 * @example
 *   <Input
 *     label="Email Address"
 *     type="email"
 *     placeholder="you@example.com"
 *     error={errors.email?.message}
 *   />
 */
'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/** Props accepted by the Input component */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input field */
  label?: string;
  /** Error message displayed below the input; also triggers red border */
  error?: string;
}

/**
 * Input component — a styled text input with glass effect.
 * Uses forwardRef to allow parent components and form libraries
 * to attach refs directly to the underlying <input> element.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    /**
     * Generate a stable ID for label-input association.
     * If the caller provides an id prop, use that; otherwise
     * fall back to the name prop (common with form libraries).
     */
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label — only rendered when provided */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground/80"
          >
            {label}
          </label>
        )}

        {/* The actual input element */}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            /* Layout and sizing */
            'h-10 w-full rounded-xl px-4 text-sm',
            /* Glass styling */
            'bg-white/5 border border-[var(--glass-border)]',
            'backdrop-blur-sm',
            /* Placeholder and text */
            'text-foreground placeholder:text-foreground/40',
            /* Focus state — brand-colored ring */
            'focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-brand-500',
            'focus-visible:border-transparent',
            /* Transitions */
            'transition-colors duration-200',
            /* Disabled state */
            'disabled:cursor-not-allowed disabled:opacity-50',
            /* Error state — red border overrides default border */
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          {...props}
        />

        {/* Error message — only rendered when an error string is provided */}
        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            className="text-xs text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

/* Display name for React DevTools debugging */
Input.displayName = 'Input';
