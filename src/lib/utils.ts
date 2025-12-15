import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function nFormatter(num: number, digits = 1): string {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
  ]
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
  const item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value)
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0"
}

/**
 * Currency options for select inputs
 */
export const currencyOption = [
  { label: "USD - US Dollar", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - British Pound", value: "GBP" },
  { label: "SDG - Sudanese Pound", value: "SDG" },
  { label: "SAR - Saudi Riyal", value: "SAR" },
  { label: "AED - UAE Dirham", value: "AED" },
  { label: "EGP - Egyptian Pound", value: "EGP" },
]
