// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The price: graduated, proportional per student, in SAR (kun decision
 * D-20261117-pricing-proportional-sar, which supersedes D-20261108's flat rate).
 * No flat bands, so no cliffs — each extra student adds the rate of the tier
 * it falls in, and the total is continuous. The tiers are derived from the
 * agreed anchors (250 students = 6,000 SAR, 500 = 10,000, 1,000 = 17,000):
 *
 *   students    1 – 250   24 SAR each   (250  →  6,000)
 *   students  251 – 500   16 SAR each   (500  → 10,000)
 *   students  501 – 1,000 14 SAR each   (1,000 → 17,000)
 *   above 1,000           14 SAR each, under its own contract
 *
 * Live classes are included up to a fair-use allowance (100 / 200 / 400 hours
 * a month for schools up to 250 / 500 / 1,000 students); more is quoted.
 * Every new school gets TRIAL_MONTHS free, then pays — no free allowance at
 * any size. Other currencies are converted from SAR at display time.
 *
 * Single source for the pricing cards, the calculator and the chatbot.
 */

export interface RateTier {
  /** Last student this rate applies to; null = no upper limit. */
  upTo: number | null
  /** SAR per student per year, before VAT. */
  sarPerStudent: number
}

export const RATE_TIERS: readonly RateTier[] = [
  { upTo: 250, sarPerStudent: 24 },
  { upTo: 500, sarPerStudent: 16 },
  { upTo: 1000, sarPerStudent: 14 },
  { upTo: null, sarPerStudent: 14 },
]

/** Live-class hours a month included, by school size (fair use; more is quoted). */
export const LIVE_HOURS: readonly { upTo: number; hours: number }[] = [
  { upTo: 250, hours: 100 },
  { upTo: 500, hours: 200 },
  { upTo: 1000, hours: 400 },
]

/** The first tier's rate — the "from" price on the cards. */
export const RATE_SAR_PER_STUDENT_YEAR = RATE_TIERS[0].sarPerStudent
/** No free allowance: billing starts at student 1. Kept so callers read 0. */
export const FREE_STUDENTS = 0
/** Every new school's free trial, in months, before the first payment. */
export const TRIAL_MONTHS = 1
/** Saudi VAT — prices are quoted before it. */
export const VAT_RATE = 0.15
/** Half at signing, then four quarterly instalments (months 3, 6, 9, 12). */
export const SIGNING_SHARE = 0.5
export const INSTALMENT_SHARE = 0.125
export const INSTALMENT_MONTHS = [3, 6, 9, 12] as const
/** Above this the school gets its own contract (same 14 SAR rate). */
export const ENTERPRISE_STUDENTS = 1000

export const CURRENCIES = ["SAR", "USD", "SDG", "EGP"] as const
export type Currency = (typeof CURRENCIES)[number]

/** Units of each currency per 1 SAR. */
export type Rates = Record<Currency, number>

/**
 * Parallel-market rates, in units per 1 USD, for currencies whose official
 * rate is far from what money actually changes hands at. Where a currency is
 * listed here, the page prices in it instead of the feed's official rate —
 * schools there pay the USD price at the market rate. Pinned by hand: there
 * is no free feed for these, so update the number and the date together.
 *
 * SDG 10,214 — Sudan parallel market, 2026-11-08 (khaligyoun.com daily
 * report; Nov 5 buy 10,293 / sell 10,348). Bank of Khartoum's official rate
 * the same week was ~4,850, the open.er-api feed ~510.
 */
export const PARALLEL_PER_USD: Partial<Record<Currency, number>> = {
  SDG: 10214,
}
export const PARALLEL_UPDATED = "2026-11-08"

/** Swap in the parallel-market rate wherever one is pinned. */
export function withParallelRates(rates: Rates): Rates {
  const out = { ...rates }
  for (const [c, perUsd] of Object.entries(PARALLEL_PER_USD)) {
    if (perUsd) out[c as Currency] = rates.USD * perUsd
  }
  return out
}

/**
 * Fallback when the live feed is down — open.er-api.com on 2026-10-10.
 * SAR→USD is the 3.75 peg. SDG here is the official rate; withParallelRates
 * replaces it with the parallel-market rate before anything is priced.
 */
export const FALLBACK_RATES: Rates = {
  SAR: 1,
  USD: 0.266667,
  SDG: 136.022,
  EGP: 13.9675,
}

export function billableStudents(students: number): number {
  return Math.max(0, Math.round(students) - FREE_STUDENTS)
}

/**
 * Annual price in SAR, before VAT: 24·min(n,250) + 16·clamp(n−250,0,250) +
 * 14·max(n−500,0). Continuous — each added student costs its tier's rate.
 */
export function annualPriceSAR(students: number): number {
  const n = billableStudents(students)
  let total = 0
  let from = 0
  for (const tier of RATE_TIERS) {
    const to = tier.upTo === null ? n : Math.min(n, tier.upTo)
    if (to > from) total += (to - from) * tier.sarPerStudent
    from = Math.max(from, to)
    if (from >= n) break
  }
  return total
}

export interface Quote {
  students: number
  billable: number
  /** All amounts in the requested currency, before VAT. */
  annual: number
  monthly: number
  /** Annual ÷ students — derived, what one student works out to. */
  perStudentYear: number
  /** The first tier's rate (24 SAR), converted — the "from" price. */
  ratePerStudentYear: number
  atSigning: number
  instalment: number
}

export function quote(
  students: number,
  currency: Currency = "SAR",
  rates: Rates = FALLBACK_RATES
): Quote {
  const fx = rates[currency] ?? FALLBACK_RATES[currency]
  const n = Math.max(0, Math.round(students))
  const annual = annualPriceSAR(n) * fx
  return {
    students: n,
    billable: billableStudents(n),
    annual,
    monthly: annual / 12,
    perStudentYear: n ? annual / n : 0,
    ratePerStudentYear: RATE_SAR_PER_STUDENT_YEAR * fx,
    atSigning: annual * SIGNING_SHARE,
    instalment: annual * INSTALMENT_SHARE,
  }
}

/**
 * "6,000" / "1.60" — whole units for totals, two decimals below 100 so a
 * per-student figure keeps its resolution. Latin digits in both locales,
 * matching the rest of the site's numbers.
 */
export function formatAmount(amount: number): string {
  const decimals = Math.abs(amount) < 100 && amount % 1 !== 0 ? 2 : 0
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * The sign each currency is shown with on the pricing cards. Latin signs lead
 * the amount ($0.53, E£28.75); Arabic ones follow it (2 ⃁, 5,447 ج.س).
 * SAR is "ر.س" set in Thmanyah, whose ligature draws it as the Saudi riyal
 * sign on every device — the U+20C1 code point itself still lacks font
 * support on many phones.
 */
export const SIGNS: Record<
  Currency,
  { ar: string; en: string; riyal?: boolean }
> = {
  USD: { ar: "$", en: "$" },
  SAR: { ar: "ر.س", en: "ر.س", riyal: true },
  SDG: { ar: "ج.س", en: "ج.س" },
  EGP: { ar: "ج.م", en: "E£" },
}

const SYMBOLS: Record<Currency, { ar: string; en: string }> = {
  SAR: { ar: "ر.س", en: "SAR" },
  USD: { ar: "دولار", en: "USD" },
  SDG: { ar: "ج.س", en: "SDG" },
  EGP: { ar: "ج.م", en: "EGP" },
}

export function currencyLabel(currency: Currency, locale: string): string {
  return SYMBOLS[currency][locale === "ar" ? "ar" : "en"]
}

/** "24 SAR" / "24 ر.س" — amount first in both languages. */
export function formatMoney(
  amount: number,
  currency: Currency,
  locale: string
): string {
  return `${formatAmount(amount)} ${currencyLabel(currency, locale)}`
}
