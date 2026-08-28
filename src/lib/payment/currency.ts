// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Currency formatting and conversion utilities.
 *
 * Handles zero-decimal currencies (JPY), 3-decimal currencies (KWD, BHD, OMR,
 * JOD, …), and standard 2-decimal currencies. Replaces scattered hardcoded
 * formatting.
 *
 * The decimal tables mirror the ISO-4217 minor units that BOTH gateways use:
 * Stripe's "zero-decimal" / "three-decimal" lists and Tap's hashstring
 * rounding rule ("AED 2.00, BHD 3.000, KWD 3.000, OMR 3.000, JOD 3.000").
 * A currency missing from these sets was a real bug: JOD (the default for
 * `JO` schools in gateway-config) was treated as 2-decimal, so a Stripe
 * charge of 10.500 JOD was sent as 1050 fils — one tenth of the fee.
 */

// Currencies with non-standard decimal places
const THREE_DECIMAL_CURRENCIES = new Set([
  "BHD",
  "IQD",
  "JOD",
  "KWD",
  "LYD",
  "OMR",
  "TND",
])
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
])

/**
 * ISO-4217 minor-unit exponent for a currency (0, 2 or 3).
 * Exported because the Tap webhook signature hashes the amount formatted to
 * exactly this many places (`"1.00"` for SAR, `"1.000"` for KWD).
 */
export function getDecimalPlaces(currency: string): number {
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

/**
 * Round a major-unit amount to the currency's minor-unit precision.
 * Guards Payment rows against float noise like `120.00000000000001` after
 * `fromSmallestUnit`, and keeps every gateway-recorded amount on the same
 * grid `Decimal(10,2)` columns store.
 */
export function roundToCurrency(amount: number, currency: string): number {
  const decimals = getDecimalPlaces(currency)
  const factor = Math.pow(10, decimals)
  return Math.round(amount * factor) / factor
}
