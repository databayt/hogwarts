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

// Below this, the full figure is short enough to read at a glance, so it is
// rendered verbatim. At or above it, summary tiles abbreviate (k / m / b) so a
// seven-digit total does not overflow a KPI card.
const COMPACT_THRESHOLD = 10_000

const COMPACT_UNITS = [
  { divisor: 1_000_000_000, suffix: "b" },
  { divisor: 1_000_000, suffix: "m" },
  { divisor: 1_000, suffix: "k" },
] as const

/**
 * Append the compact suffix directly after the last numeric part, so the unit
 * stays glued to the digits regardless of where the locale puts the currency
 * symbol (Arabic renders it trailing, English leading).
 */
function appendUnit(parts: Intl.NumberFormatPart[], suffix: string): string {
  const NUMERIC = new Set(["integer", "group", "decimal", "fraction"])
  let last = -1
  parts.forEach((part, i) => {
    if (NUMERIC.has(part.type)) last = i
  })
  return parts.map((p, i) => (i === last ? p.value + suffix : p.value)).join("")
}

/**
 * Format a whole-currency-unit amount for summary tiles, abbreviating large
 * figures (2,005,940 SDG → "2m ج.س."). Use on dashboard KPIs and card headers;
 * ledgers, invoices and tables must keep `formatMoney` so figures stay exact.
 */
export function formatCompactMoney(
  amount: number,
  currency: string = "USD",
  locale: string = "en"
): string {
  const abs = Math.abs(amount)
  if (abs < COMPACT_THRESHOLD) return formatMoney(amount, currency, locale)

  const unit = COMPACT_UNITS.find((u) => abs >= u.divisor)
  if (!unit) return formatMoney(amount, currency, locale)

  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  const parts = new Intl.NumberFormat(bcp47, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 1,
  }).formatToParts(amount / unit.divisor)

  return appendUnit(parts, unit.suffix)
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
