"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tuition editor — one big amount, the currency as a suffix chip, and an
 * inset group for currency + schedule. Auto-saves; every save sends only the
 * fields this page owns (plus the registration/application fees passed
 * through unchanged), so a Sudanese school's SDG fees are never reset.
 */
import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  currencyLabel,
  type Currency,
} from "@/components/saas-marketing/pricing/rates"

import { updateSchoolPricing } from "./actions"
import { formatCount } from "./ui/format"
import { SaveStatus } from "./ui/save-status"
import { Segmented } from "./ui/segmented"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"
import { useAutoSave } from "./use-auto-save"

const CURRENCY_OPTIONS = ["SDG", "SAR", "USD", "EGP"] as const
const SCHEDULES = ["annual", "termly", "monthly"] as const
type Schedule = (typeof SCHEDULES)[number]

const MAX_FEE = 99_999_999

interface Props {
  schoolId: string
  initial: {
    tuitionFee: number | null
    currency: string | null
    registrationFee: number | null
    applicationFee: number | null
    paymentSchedule: string | null
    country: string | null
  }
  lang: string
  t: Dictionary["schoolBilling"]
}

const isSudan = (country: string | null) =>
  !!country && /^(sd|sudan|السودان)$/i.test(country.trim())

/** The school's currency; a Sudanese school still on the USD column default reads SDG. */
function initialCurrency(currency: string | null, country: string | null) {
  const c = (currency ?? "").toUpperCase()
  if (isSudan(country) && (!c || c === "USD")) return "SDG"
  return c || "SDG"
}

/** Rows written before the editor used `termly` read as per term. */
function initialSchedule(value: string | null): Schedule {
  if (value === "annual" || value === "monthly") return value
  if (value === "termly" || value === "semester" || value === "quarterly")
    return "termly"
  return "annual"
}

function currencySymbol(currency: string, lang: string): string {
  if (currency === "USD" && lang !== "ar") return "$"
  if ((CURRENCY_OPTIONS as readonly string[]).includes(currency))
    return currencyLabel(currency as Currency, lang)
  return currency
}

/** Latin digits only — Arabic-Indic and Persian digits typed on a phone map over. */
function parseAmount(raw: string): number | null {
  const latin = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
  if (!latin) return null
  return Math.min(Number(latin), MAX_FEE)
}

export function ConfigPriceForm({ schoolId, initial, lang, t }: Props) {
  const p = t.price

  const start = {
    fee: initial.tuitionFee,
    currency: initialCurrency(initial.currency, initial.country),
    schedule: initialSchedule(initial.paymentSchedule),
  }
  const [fee, setFee] = useState<number | null>(start.fee)
  const [currency, setCurrency] = useState(start.currency)
  const [schedule, setSchedule] = useState<Schedule>(start.schedule)
  const [saved, setSaved] = useState(start)
  const [focused, setFocused] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // An unknown stored currency (e.g. EUR from an old onboarding) stays
  // selectable instead of silently switching.
  const currencies: string[] = (CURRENCY_OPTIONS as readonly string[]).includes(
    currency
  )
    ? [...CURRENCY_OPTIONS]
    : [...CURRENCY_OPTIONS, currency]

  const isDirty =
    fee !== saved.fee ||
    currency !== saved.currency ||
    schedule !== saved.schedule

  useAutoSave(
    () => {
      if (!isDirty) return
      const next = { fee, currency, schedule }
      startTransition(async () => {
        const result = await updateSchoolPricing(schoolId, {
          tuitionFee: next.fee,
          currency: next.currency,
          paymentSchedule: next.schedule,
          // Passed through untouched — this page never edits them.
          registrationFee: initial.registrationFee,
          applicationFee: initial.applicationFee,
        })
        if (result.success) {
          setSaved(next)
          setSavedAt(Date.now())
        } else {
          ErrorToast(result.error || t.errors.saveFailed)
        }
      })
    },
    isDirty,
    800
  )

  const display =
    fee == null ? "" : focused ? String(fee) : formatCount(fee, lang)

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <label
          htmlFor="tuition-fee"
          className="text-muted-foreground block text-sm"
        >
          {p.label}
        </label>
        <div className="flex items-center gap-3">
          <input
            id="tuition-fee"
            dir="ltr"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label={p.amountAria}
            placeholder={p.placeholder}
            value={display}
            onChange={(e) => setFee(parseAmount(e.target.value))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="placeholder:text-muted-foreground/40 [field-sizing:content] min-w-[2ch] bg-transparent text-start text-5xl font-semibold tracking-tight tabular-nums outline-none sm:text-6xl"
          />
          <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-3 py-1 text-sm font-medium">
            {currencySymbol(currency, lang)}
          </span>
        </div>
        <SaveStatus pending={isPending} savedAt={savedAt} />
      </section>

      <SettingsGroup title={p.settings}>
        <SettingsRow
          label={p.currency}
          description={p.currencyDescription}
          stack
        >
          <Segmented
            aria-label={p.currency}
            value={currency}
            onValueChange={setCurrency}
            options={currencies.map((c) => ({
              value: c,
              label:
                (p.currencies as Record<string, string>)[c] ??
                currencySymbol(c, lang),
            }))}
          />
        </SettingsRow>
        <SettingsRow
          label={p.schedule}
          description={p.scheduleDescription}
          stack
        >
          <Segmented
            aria-label={p.schedule}
            value={schedule}
            onValueChange={setSchedule}
            options={SCHEDULES.map((s) => ({
              value: s,
              label: p.schedules[s],
            }))}
          />
        </SettingsRow>
      </SettingsGroup>

      <section className="space-y-3 px-4">
        <h3 className="text-sm font-medium">{p.guideTitle}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {p.guide}
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/${lang}/finance/fees/structures`}>
            {p.guideLink}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </Button>
      </section>
    </div>
  )
}
