import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names, resolving Tailwind CSS conflicts.
 * Drop-in compatible with shadcn/ui expectations.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
