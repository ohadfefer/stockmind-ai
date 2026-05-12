import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parses an ISO date string ("YYYY-MM-DD") as a local-timezone Date so
// downstream toLocaleDateString() doesn't shift the day for users west of UTC.
export function parseIsoDateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}
