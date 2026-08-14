// Copyright (c) 2025-present databayt

// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure money/number formatters -- **safe to import from a client component**.
 *
 * These live apart from `format.ts` on purpose. That barrel re-exports
 * `formatCurrency` / `toCents` / `fromCents` from `./accounting/utils`, which
 * imports `@/lib/db`; pulling the barrel into a `"use client"` module drags
 * Prisma into the browser bundle and the page dies at runtime with
 * "PrismaClient is unable to run in this browser environment". Neither `tsc`
 * nor `next build` catches it -- it only shows up when the route renders.
 *
 * Server components may import from either module. Client components must
 * import from this one.
 */

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
// rendered verbatim. At or above it, summary tiles abbreviate so a seven-digit
// total does not overflow a KPI card.
const COMPACT_THRESHOLD = 10_000

/**
 * Format a whole-currency-unit amount for summary tiles, abbreviating large
 * figures. Use on dashboard KPIs and card headers; ledgers, invoices and
 * tables must keep `formatMoney` so figures stay exact.
 *
 * Abbreviation comes from `Intl`'s own compact notation rather than a hand-
 * rolled suffix table, because the abbreviation is a translatable word, not a
 * letter: Arabic reads ١٠٫٦ مليون / ١٦٤٫٥ ألف / ١٫٥ مليار. Gluing a Latin "m"
 * onto Arabic digits produced "١٠٫٦m ج.س.", which is not a thing anyone reads.
 *
 *   en  10,593,000 SDG -> "SDG 10.6m"
 *   ar  10,593,000 SDG -> "‏١٠٫٦ مليون ج.س."
 */
export function formatCompactMoney(
  amount: number,
  currency: string = "USD",
  locale: string = "en"
): string {
  if (Math.abs(amount) < COMPACT_THRESHOLD)
    return formatMoney(amount, currency, locale)

  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  const parts = new Intl.NumberFormat(bcp47, {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 1,
  }).formatToParts(amount)

  // Intl gives "10.6M"; the house style is lowercase. Only the `compact` part
  // is touched, so the currency code keeps its capitals and a translated word
  // like "مليون" is left exactly as the locale wrote it.
  return parts
    .map((part) =>
      part.type === "compact" && /^[A-Za-z]+$/.test(part.value)
        ? part.value.toLowerCase()
        : part.value
    )
    .join("")
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
