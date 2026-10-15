"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Plan & limits — three apple.com-style plan columns (Free / Pro /
 * Enterprise, the public pricing), an inset "Limits" group with usage bars,
 * and the annual estimate from `rates.ts` in the school's own currency.
 * Clicking a column selects the plan; everything auto-saves.
 */
import { useState, useTransition } from "react"
import { Check } from "lucide-react"

import { PLAN_TYPES, type PlanType } from "@/lib/plan-type"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ErrorToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  ENTERPRISE_STUDENTS,
  quote,
  RATE_SAR_PER_STUDENT_YEAR,
  type Currency,
  type Rates,
} from "@/components/saas-marketing/pricing/rates"
import { formatMoney } from "@/components/school-dashboard/finance/lib/format-money"

import { updatePlanLimits } from "./actions"
import { formatCount } from "./ui/format"
import { SaveStatus } from "./ui/save-status"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"
import { useAutoSave } from "./use-auto-save"

interface Limits {
  maxStudents: number
  maxTeachers: number
  maxClasses: number
}

interface Props {
  schoolId: string
  initialData: Limits & { planType: PlanType }
  currentUsage: { students: number; teachers: number; classes: number }
  currency: Currency
  rates: Rates
  canEdit: boolean
  lang: Locale
  t: Dictionary["schoolBilling"]
}

const LIMIT_FIELDS = [
  { key: "maxStudents", usage: "students", max: 100000, label: "students" },
  { key: "maxTeachers", usage: "teachers", max: 10000, label: "teachers" },
  { key: "maxClasses", usage: "classes", max: 1000, label: "classes" },
] as const

/** Free covers 100 students and 10 teachers — choosing it sets both. */
const FREE_LIMITS = { maxStudents: 100, maxTeachers: 10 }

const fill = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)

/** Whole number in range, from Latin or Arabic-Indic digits; null when invalid. */
function parseLimit(raw: string, max: number): number | null {
  const latin = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[,٬\s]/g, "")
  if (!/^\d+$/.test(latin)) return null
  const n = Number(latin)
  return n >= 1 && n <= max ? n : null
}

export function PlanLimitsSection({
  schoolId,
  initialData,
  currentUsage,
  currency,
  rates,
  canEdit,
  lang,
  t,
}: Props) {
  const tp = t.plan
  const [plan, setPlan] = useState<PlanType>(initialData.planType)
  const [inputs, setInputs] = useState<Record<keyof Limits, string>>({
    maxStudents: String(initialData.maxStudents),
    maxTeachers: String(initialData.maxTeachers),
    maxClasses: String(initialData.maxClasses),
  })
  const [saved, setSaved] = useState(initialData)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const parsed = {
    maxStudents: parseLimit(inputs.maxStudents, 100000),
    maxTeachers: parseLimit(inputs.maxTeachers, 10000),
    maxClasses: parseLimit(inputs.maxClasses, 1000),
  }
  const isValid = Object.values(parsed).every((v) => v !== null)
  const isDirty =
    plan !== saved.planType ||
    parsed.maxStudents !== saved.maxStudents ||
    parsed.maxTeachers !== saved.maxTeachers ||
    parsed.maxClasses !== saved.maxClasses

  useAutoSave(
    () => {
      if (!canEdit || !isDirty || !isValid) return
      const next = {
        planType: plan,
        maxStudents: parsed.maxStudents!,
        maxTeachers: parsed.maxTeachers!,
        maxClasses: parsed.maxClasses!,
      }
      startTransition(async () => {
        const result = await updatePlanLimits(schoolId, next)
        if (result.success) {
          setSaved(next)
          setSavedAt(Date.now())
        } else {
          ErrorToast(result.error || t.errors.saveFailed)
        }
      })
    },
    canEdit && isDirty && isValid,
    800
  )

  function selectPlan(id: PlanType) {
    setPlan(id)
    if (id === "free") {
      setInputs((prev) => ({
        ...prev,
        maxStudents: String(FREE_LIMITS.maxStudents),
        maxTeachers: String(FREE_LIMITS.maxTeachers),
      }))
    }
  }

  // Prices — the rate in SAR, plus the school's own currency when it differs.
  const rateLocal = quote(0, currency, rates).ratePerStudentYear
  const money = (amount: number, cur: string) =>
    formatMoney(amount, cur, lang, {
      maximumFractionDigits: amount < 100 && amount % 1 !== 0 ? 2 : 0,
    })

  const priceLine: Record<PlanType, { main: string; sub?: string }> = {
    free: { main: tp.plans.free.price },
    pro: {
      main: fill(tp.plans.pro.price, {
        rate: money(RATE_SAR_PER_STUDENT_YEAR, "SAR"),
      }),
      sub:
        currency !== "SAR"
          ? fill(tp.plans.pro.priceLocal, {
              amount: money(rateLocal, currency),
            })
          : undefined,
    },
    enterprise: { main: tp.plans.enterprise.price },
  }

  const q = quote(currentUsage.students, currency, rates)
  const qSar = quote(currentUsage.students, "SAR", rates)

  return (
    <div data-wide className="space-y-10">
      <div className="flex justify-end">
        <SaveStatus pending={isPending} savedAt={savedAt} />
      </div>

      {/* Plan columns */}
      <div
        role="radiogroup"
        aria-label={tp.plansLabel}
        className="grid gap-4 md:grid-cols-3"
      >
        {PLAN_TYPES.map((id) => {
          const info = tp.plans[id]
          const selected = plan === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!canEdit}
              onClick={() => selectPlan(id)}
              className={cn(
                "bg-card flex h-full flex-col gap-4 rounded-2xl border p-5 text-start transition-all",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                "disabled:cursor-default",
                selected
                  ? "ring-primary border-transparent ring-2"
                  : "hover:border-foreground/20"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {info.name}
                  </h3>
                  {selected ? (
                    <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                      {tp.currentPlan}
                    </span>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {info.who}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{priceLine[id].main}</p>
                {priceLine[id].sub ? (
                  <p className="text-muted-foreground text-xs">
                    {priceLine[id].sub}
                  </p>
                ) : null}
              </div>
              <ul className="space-y-2 text-sm">
                {info.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {/* Limits */}
      <SettingsGroup title={tp.limits.title} footer={tp.limits.footer}>
        {LIMIT_FIELDS.map((field) => {
          const used = currentUsage[field.usage]
          const max = parsed[field.key]
          const pct = max ? Math.min(100, (used / max) * 100) : 0
          const invalid = max === null
          const inputId = `limit-${field.key}`
          return (
            <SettingsRow
              key={field.key}
              label={<label htmlFor={inputId}>{tp.limits[field.label]}</label>}
              description={
                <div className="space-y-1.5 pt-1">
                  {invalid ? (
                    <span className="text-destructive">
                      {fill(tp.limits.invalid, {
                        max: formatCount(field.max, lang),
                      })}
                    </span>
                  ) : (
                    <>
                      <span>
                        {fill(tp.limits.usage, {
                          used: formatCount(used, lang),
                          max: formatCount(max, lang),
                        })}
                      </span>
                      <div className="bg-muted h-1 w-full max-w-56 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct >= 90 ? "bg-destructive" : "bg-primary"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              }
            >
              <Input
                id={inputId}
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                value={inputs[field.key]}
                disabled={!canEdit}
                aria-invalid={invalid}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="w-28 text-end tabular-nums"
              />
            </SettingsRow>
          )
        })}
      </SettingsGroup>

      {/* Annual estimate */}
      <section className="bg-muted/40 space-y-3 rounded-2xl p-6">
        <p className="text-muted-foreground text-sm">{tp.summary.title}</p>
        <p className="text-4xl font-semibold tracking-tight tabular-nums">
          {money(q.annual, currency)}
        </p>
        {q.billable === 0 ? (
          <p className="text-muted-foreground text-sm">{tp.summary.allFree}</p>
        ) : (
          <div className="text-muted-foreground space-y-1 text-sm leading-relaxed">
            {currency !== "SAR" ? (
              <p>
                {fill(tp.summary.reference, {
                  amount: money(qSar.annual, "SAR"),
                })}
              </p>
            ) : null}
            <p>
              {fill(tp.summary.forStudents, {
                students: formatCount(q.students, lang),
                billable: formatCount(q.billable, lang),
              })}{" "}
              {tp.summary.vat}
            </p>
            <p>
              {fill(tp.summary.schedule, {
                signing: money(q.atSigning, currency),
                instalment: money(q.instalment, currency),
              })}
            </p>
          </div>
        )}
        {plan === "enterprise" ||
        currentUsage.students >= ENTERPRISE_STUDENTS ? (
          <p className="text-muted-foreground text-sm">
            {tp.summary.enterprise}
          </p>
        ) : null}
      </section>
    </div>
  )
}
