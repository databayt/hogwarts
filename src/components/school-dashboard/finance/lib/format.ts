// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Thin barrel so finance components import money + date formatters from one path.
// Money amounts across finance are stored in cents; formatCurrency handles the
// division so callers pass raw `Decimal.toNumber()` values without extra math.

export { formatCurrency, toCents, fromCents } from "./accounting/utils"
export { formatDate, getDateLocale } from "@/lib/format-date"

/**
 * Format a whole-currency-unit amount (not cents) as a localized currency string.
 * Use this when the upstream value is already in the display currency unit
 * (e.g., dashboard aggregates that do not multiply by 100).
 */
export function formatMoney(
  amount: number,
  currency: string = "USD",
  locale: string = "en",
  opts?: Intl.NumberFormatOptions
): string {
  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  return new Intl.NumberFormat(bcp47, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
    ...opts,
  }).format(amount)
}

/**
 * Locale-aware number formatter (no currency symbol).
 * Swaps Western digits for Arabic-Indic when locale === "ar".
 */
export function formatNumber(
  value: number,
  locale: string = "en",
  opts?: Intl.NumberFormatOptions
): string {
  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  return new Intl.NumberFormat(bcp47, opts).format(value)
}
