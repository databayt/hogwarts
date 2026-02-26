// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Currency formatting and conversion utilities.
 *
 * Handles zero-decimal currencies (JPY), 3-decimal currencies (KWD, BHD, OMR),
 * and standard 2-decimal currencies. Replaces scattered hardcoded formatting.
 */

// Currencies with non-standard decimal places
const THREE_DECIMAL_CURRENCIES = new Set(["KWD", "BHD", "OMR"])
const ZERO_DECIMAL_CURRENCIES = new Set([
  "JPY",
  "KRW",
  "VND",
  "CLP",
  "PYG",
  "UGX",
  "RWF",
])

function getDecimalPlaces(currency: string): number {
  const upper = currency.toUpperCase()
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) return 0
  if (THREE_DECIMAL_CURRENCIES.has(upper)) return 3
  return 2
}

/**
 * Format an amount for display using Intl.NumberFormat.
 * Automatically handles locale-appropriate formatting.
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string
): string {
  const resolvedLocale = locale ?? (currency === "SDG" ? "ar-SD" : "en-US")
  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: getDecimalPlaces(currency),
    maximumFractionDigits: getDecimalPlaces(currency),
  }).format(amount)
}

/**
 * Convert a human-readable amount to the smallest currency unit
 * for gateway APIs (Stripe uses cents, Tap uses fils).
 *
 * Examples:
 * - toSmallestUnit(10.50, "USD") → 1050 (cents)
 * - toSmallestUnit(10.500, "KWD") → 10500 (fils)
 * - toSmallestUnit(1000, "JPY") → 1000 (yen, no subunit)
 */
export function toSmallestUnit(amount: number, currency: string): number {
  const decimals = getDecimalPlaces(currency)
  return Math.round(amount * Math.pow(10, decimals))
}

/**
 * Convert from smallest currency unit back to human-readable amount.
 *
 * Examples:
 * - fromSmallestUnit(1050, "USD") → 10.50
 * - fromSmallestUnit(10500, "KWD") → 10.500
 */
export function fromSmallestUnit(amount: number, currency: string): number {
  const decimals = getDecimalPlaces(currency)
  return amount / Math.pow(10, decimals)
}
