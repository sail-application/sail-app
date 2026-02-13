/**
 * Card — Glassmorphism card component system for SAIL.
 *
 * A composable set of sub-components that together form a card layout
 * with the SAIL glassmorphism design language: translucent background,
 * backdrop blur, subtle border, and soft shadow.
 *
 * Sub-components:
 *   - Card:            The outer container with glass styling
 *   - CardHeader:      Top section for title + description
 *   - CardTitle:       Heading text (renders as h3)
 *   - CardDescription: Supporting text below the title
 *   - CardContent:     Main body area
 *   - CardFooter:      Bottom section with top border, typically for actions
 *
 * All sub-components accept a className prop for customization via cn().
 *
 * @example
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Call Score</CardTitle>
 *       <CardDescription>Your latest practice session results</CardDescription>
 *     </CardHeader>
 *     <CardContent>
 *       <p>Score: 87/100</p>
 *     </CardContent>
 *     <CardFooter>
 *       <Button>Try Again</Button>
 *     </CardFooter>
 *   </Card>
 */

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Card — The root container.
 * Applies the full glassmorphism effect: translucent background,
 * backdrop blur, rounded corners, border, and shadow.
 */
export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        'bg-[var(--glass-bg)] backdrop-blur-md',
        'border border-[var(--glass-border)]',
        'shadow-[var(--glass-shadow)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader — Top section of the card.
 * Provides consistent padding and vertical spacing for title/description.
 */
export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardTitle — The card's heading.
 * Renders as an h3 for proper document outline hierarchy.
 */
export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-tight tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * CardDescription — Supporting text below CardTitle.
 * Rendered at reduced opacity to visually de-emphasize.
 */
export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-foreground/60', className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * CardContent — The main body area of the card.
 * Has horizontal and bottom padding (no top padding since
 * CardHeader already provides spacing above).
 */
export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 pb-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardFooter — Bottom section of the card.
 * Includes a subtle top border to visually separate actions
 * from content. Uses flexbox for horizontal layout.
 */
export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-6 py-4',
        'border-t border-[var(--glass-border)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
