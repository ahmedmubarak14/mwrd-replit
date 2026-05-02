import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormat(value: string | number | Date | null | undefined, pattern: string, fallback = "—"): string {
  if (value == null) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  return isValid(d) ? format(d, pattern) : fallback;
}

export function safeLocaleDate(value: string | number | Date | null | undefined, fallback = "—"): string {
  if (value == null) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  return isValid(d) ? d.toLocaleDateString() : fallback;
}
