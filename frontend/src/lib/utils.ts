import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let idCounter = 0

// uniqueId builds a client-side id that stays unique even when several are
// created in the same millisecond — Date.now() alone produces duplicate React
// keys when messages are sent in a burst (optimistic + socket echo).
export function uniqueId(prefix: string) {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`
}
