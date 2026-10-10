"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Per-student price calculator. Every student beyond the free 100 weighs the
// same (rates.ts), so the price moves with every single student — the slider
// steps by one, and the bill, the per-student cost and the instalment plan
// all recompute live in the chosen currency.
import { useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { CurrencyToggle, useCurrency } from "./currency"
import {
  ENTERPRISE_STUDENTS,
  formatMoney,
  FREE_STUDENTS,
  INSTALMENT_MONTHS,
  quote,
} from "./rates"

const MIN_STUDENTS = 1
const SLIDER_MAX = 2000
const INPUT_MAX = 100000

interface CalculatorProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
  lang?: string
}

export function Calculator({ dictionary, lang = "en" }: CalculatorProps) {
  const pricing = dictionary?.marketing?.pricing
  const t = pricing?.calculator as Record<string, string> | undefined
  const { currency, rates, updated } = useCurrency()
  const [count, setCount] = useState(250)

  const q = quote(count, currency, rates)
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
    "mailto:contact@databayt.org?subject=Enterprise%20plan"

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
              "Every student weighs the same — {rate} a year. Your first {free} students are free.",
            {
              rate: money(q.ratePerStudentYear),
              free: String(FREE_STUDENTS),
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
              {fill(
                t?.resultFree ||
                  "Free — your first {free} students cost nothing",
                { free: String(FREE_STUDENTS) }
              )}
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
                <p className="muted mt-1 text-sm tabular-nums">
                  {fill(
                    t?.breakdown ||
                      "{billable} students × {rate} — the first {free} free",
                    {
                      billable: q.billable.toLocaleString("en-US"),
                      rate: money(q.ratePerStudentYear),
                      free: String(FREE_STUDENTS),
                    }
                  )}
                </p>
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
                    {t?.perStudentLabel || "Per student, per year"}
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
                      "Over 1,000 students: the same rate, with a dedicated contract and account manager."}
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
            "Prices exclude VAT (15% in Saudi Arabia). Hosting, support and updates included."}
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
