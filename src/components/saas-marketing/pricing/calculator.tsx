"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Per-student price calculator. The price is graduated and proportional
// (rates.ts: 24 SAR a student up to 250, 16 up to 500, 14 beyond), so it moves
// with every single student — the slider steps by one, and the total, the
// per-tier breakdown, the average per student and the instalment plan all
// recompute live in the chosen currency.
import { useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { CurrencyToggle, useCurrency } from "./currency"
import {
  ENTERPRISE_STUDENTS,
  formatMoney,
  INSTALMENT_MONTHS,
  quote,
  RATE_TIERS,
} from "./rates"

const MIN_STUDENTS = 1
const SLIDER_MAX = 2000
const INPUT_MAX = 100000

interface CalculatorProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
  lang?: string
}

export function Calculator({
  dictionary: dictionaryProp,
  lang = "en",
}: CalculatorProps) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const pricing = dictionary?.marketing?.pricing
  const t = pricing?.calculator as Record<string, string> | undefined
  const { currency, rates, updated } = useCurrency()
  const [count, setCount] = useState(250)

  const q = quote(count, currency, rates)
  const fx = rates[currency] ?? 1
  // Students in each tier, for the breakdown lines.
  const tierLines = RATE_TIERS.flatMap((tier, i) => {
    const from = i === 0 ? 0 : (RATE_TIERS[i - 1].upTo ?? 0)
    // The last tier repeats 14 SAR past 1,000 — fold it into the one above.
    if (i === RATE_TIERS.length - 1) return []
    const to =
      i === RATE_TIERS.length - 2 ? q.students : (tier.upTo ?? q.students)
    const students = Math.min(q.students, to) - from
    return students > 0 ? [{ students, sar: tier.sarPerStudent }] : []
  })
  const money = (n: number) => formatMoney(n, currency, lang)
  const fill = (template: string, values: Record<string, string>) =>
    Object.entries(values).reduce(
      (s, [k, v]) => s.replaceAll(`{${k}}`, v),
      template
    )

  const clamp = (n: number) =>
    Math.min(INPUT_MAX, Math.max(MIN_STUDENTS, Math.round(n)))
  const isFree = q.billable === 0
  const isEnterprise = count > ENTERPRISE_STUDENTS
  const contactHref =
    pricing?.enterprise?.contactHref ||
    "mailto:sales@databayt.org?subject=Enterprise%20plan"

  const ratesDate = updated
    ? new Date(updated).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        calendar: "gregory",
        numberingSystem: "latn",
      })
    : null

  return (
    <section className="bg-muted w-full rounded-3xl p-8 md:p-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {t?.title || "Calculate your price"}
        </h2>
        <p className="muted">
          {fill(
            t?.subtitle ||
              "{r1} a student up to 250, {r2} up to 500, {r3} beyond — a year. Your first month is free.",
            {
              r1: money(RATE_TIERS[0].sarPerStudent * fx),
              r2: money(RATE_TIERS[1].sarPerStudent * fx),
              r3: money(RATE_TIERS[2].sarPerStudent * fx),
            }
          )}
        </p>

        <CurrencyToggle
          locale={lang}
          label={t?.currencyLabel || "Currency"}
          className="mt-4"
        />

        <div className="mt-6 flex w-full items-center gap-4">
          <Slider
            value={[Math.min(count, SLIDER_MAX)]}
            min={MIN_STUDENTS}
            max={SLIDER_MAX}
            step={1}
            onValueChange={([v]) => setCount(clamp(v ?? MIN_STUDENTS))}
            aria-label={t?.studentCountLabel || "Students"}
            // The track is bg-muted by default — invisible on this bg-muted card.
            className="[&_[data-slot=slider-track]]:bg-background flex-1"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={MIN_STUDENTS}
              max={INPUT_MAX}
              value={count}
              onChange={(e) =>
                setCount(clamp(Number(e.target.value) || MIN_STUDENTS))
              }
              className="bg-background w-24 text-center"
              aria-label={t?.studentCountLabel || "Students"}
            />
            <span className="muted text-sm">
              {t?.studentCountLabel || "Students"}
            </span>
          </div>
        </div>

        <div className="mt-8 w-full" aria-live="polite">
          {isFree ? (
            <p className="font-heading text-2xl font-bold">
              {t?.resultFree || "Add your students to see the price"}
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <p className="muted text-sm">
                  {t?.annualLabel || "Annual price"}
                </p>
                <p className="font-heading text-4xl font-extrabold tabular-nums">
                  {money(q.annual)}
                </p>
                {tierLines.map((line) => (
                  <p key={line.sar} className="muted mt-1 text-sm tabular-nums">
                    {fill(t?.breakdown || "{billable} students × {rate}", {
                      billable: line.students.toLocaleString("en-US"),
                      rate: money(line.sar * fx),
                    })}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background rounded-xl p-4">
                  <p className="muted text-xs">
                    {t?.monthlyLabel || "Per month"}
                  </p>
                  <p className="font-heading text-lg font-bold tabular-nums">
                    {money(q.monthly)}
                  </p>
                </div>
                <div className="bg-background rounded-xl p-4">
                  <p className="muted text-xs">
                    {t?.perStudentLabel || "Average per student, per year"}
                  </p>
                  <p className="font-heading text-lg font-bold tabular-nums">
                    {money(q.perStudentYear)}
                  </p>
                </div>
              </div>

              <div className="bg-background rounded-xl p-4 text-start">
                <p className="font-heading mb-3 text-sm font-semibold">
                  {t?.scheduleTitle || "Payment plan"}
                </p>
                <div className="flex items-center justify-between gap-4 border-b pb-2 text-sm">
                  <span className="muted">
                    {t?.atSigning || "At signing (50%)"}
                  </span>
                  <span className="font-medium tabular-nums">
                    {money(q.atSigning)}
                  </span>
                </div>
                {INSTALMENT_MONTHS.map((month) => (
                  <div
                    key={month}
                    className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-b-0"
                  >
                    <span className="muted">
                      {fill(t?.instalment || "Month {month} (12.5%)", {
                        month: String(month),
                      })}
                    </span>
                    <span className="font-medium tabular-nums">
                      {money(q.instalment)}
                    </span>
                  </div>
                ))}
              </div>

              {isEnterprise && (
                <div className="flex flex-col items-center gap-3">
                  <p className="muted text-sm">
                    {t?.enterpriseNote ||
                      "Over 1,000 students: 14 SAR a student, under its own contract with a dedicated account manager."}
                  </p>
                  <Link
                    href={contactHref}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" })
                    )}
                  >
                    {t?.talkToSales || "Talk to Sales"}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="muted mt-4 text-xs">
          {t?.vatNote ||
            "All-in: hosting, support and updates included, with no VAT added."}
          {currency !== "SAR" && (
            <>
              {" "}
              {ratesDate
                ? fill(
                    t?.ratesNote ||
                      "Converted from SAR at the exchange rate of {date}.",
                    { date: ratesDate }
                  )
                : t?.ratesFallbackNote ||
                  "Converted from SAR at an approximate exchange rate."}
            </>
          )}
        </p>
      </div>
    </section>
  )
}
