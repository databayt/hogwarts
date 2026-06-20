// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Thin barrel so finance components import money + date formatters from one path.
// Convention: finance money (Payment.amount, the ledger's Decimal(12,2) columns,
// fee/invoice amounts) is stored in WHOLE currency units. Use `formatMoney` for
// those. `formatCurrency` (re-exported below) divides by 100 and is ONLY for the
// rare value genuinely stored as integer cents — never use it on whole-unit
// aggregates (it renders 1/100 of the real figure).

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
