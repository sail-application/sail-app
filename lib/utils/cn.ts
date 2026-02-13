/**
 * cn — Class Name Utility
 *
 * Merges Tailwind CSS class names using clsx for conditional logic
 * and tailwind-merge to resolve conflicting utility classes.
 * This is the standard pattern for composable className props
 * across all SAIL UI components.
 *
 * Usage:
 *   cn('bg-red-500', isActive && 'bg-blue-500', className)
 *   // tailwind-merge ensures only the last conflicting class wins
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
