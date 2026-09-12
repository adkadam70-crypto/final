import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// number inputs with min/max attributes only validate on form submit —
// nothing stops a user from typing/scrolling past the range in the field
// itself. This clamps on every keystroke so an out-of-range value (a score
// above a test's real maximum, negative marks, etc.) can never actually be
// entered, rather than just being flagged later.
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}
