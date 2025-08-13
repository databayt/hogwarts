import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nFormatter(num: number): string {
  if (num < 1000) return `${num}`
  const units = ["K", "M", "B", "T"]
  let unitIndex = -1
  let value = num
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000
    unitIndex++
  }
  return `${parseFloat(value.toFixed(1))}${units[unitIndex]}`
}

// Invoice: supported currency options map (ISO code -> label)
export const currencyOption: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  INR: "Indian Rupee",
}

// --- Tenant helpers ---
import type { UserRole } from "@prisma/client"

export type TenantContext = {
  schoolId: string | null
  requestId: string | null
  role: UserRole | null
  isPlatformAdmin: boolean
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
