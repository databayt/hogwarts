// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The price, as one number per student. The pricing rationale (2026-10-09)
 * set 6,000 SAR a year for a 250-student school; flat bands made a
 * 100-student school pay 60 SAR a head. Instead every student weighs the
 * same — 6,000 ÷ 250 = 24 SAR (= $6.40) a year — so the bill grows in exact
 * proportion to enrolment, one student at a time.
 *
 * Since 2026-11-08 every student counts from the first: the "first 100 free"
 * allowance made the first real schools (48 and 14 students) free forever.
 * A new school gets TRIAL_MONTHS free instead (kun decision
 * D-20261108-pricing-one-month-trial).
 *
 * Single source for the pricing cards, the calculator and the chatbot.
 */

/** SAR per billable student per year — 6,000 SAR ÷ 250 students. */
export const RATE_SAR_PER_STUDENT_YEAR = 24
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
/** Above this the school gets a dedicated contract (same per-student rate). */
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

/** Annual price in SAR, before VAT. */
export function annualPriceSAR(students: number): number {
  return billableStudents(students) * RATE_SAR_PER_STUDENT_YEAR
}

export interface Quote {
  students: number
  billable: number
  /** All amounts in the requested currency, before VAT. */
  annual: number
  monthly: number
  /** Annual ÷ all students — what one student really costs, free ones included. */
  perStudentYear: number
  /** The rate itself, converted. */
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
