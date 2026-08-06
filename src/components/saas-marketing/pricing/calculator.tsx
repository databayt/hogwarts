"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Per-student cost calculator — makes the unit price concrete: drag to your
// student count, read the monthly bill. ≤100 students resolves to Free,
// 1,000+ routes to Enterprise with an illustrative estimate.
import { useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { BillingToggle } from "./billing-toggle"
import {
  getMonthlyCost,
  isEnterprisePlan,
  isProPlan,
  pricingData,
} from "./config"

const MIN_STUDENTS = 1
const MAX_STUDENTS = 2000
const FREE_CAP = 100
const ENTERPRISE_FLOOR = 1000

interface CalculatorProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function Calculator({ dictionary }: CalculatorProps) {
  const pricing = dictionary?.marketing?.pricing
  const t = pricing?.calculator
  const [count, setCount] = useState(300)
  const [isYearly, setIsYearly] = useState(false)

  const pro = pricingData.find((p) => isProPlan(p.id))!
  const enterprise = pricingData.find((p) => isEnterprisePlan(p.id))!

  const fmt = (n: number): string =>
    n % 1 === 0 ? n.toLocaleString("en-US") : n.toFixed(2)

  const fill = (template: string, amount: number): string =>
    template.replace("{amount}", fmt(amount))

  const isFreeRange = count <= FREE_CAP
  const isEnterpriseRange = count >= ENTERPRISE_FLOOR
  const proCost = getMonthlyCost(pro, count, isYearly)
  const proRaw = (isYearly ? pro.prices.yearly : pro.prices.monthly) * count
  const minimumApplies =
    !isFreeRange && !isEnterpriseRange && pro.minimumMonthly
      ? proRaw < pro.minimumMonthly
      : false
  const enterpriseEstimate = getMonthlyCost(enterprise, count, isYearly)

  const clamp = (n: number) =>
    Math.min(MAX_STUDENTS, Math.max(MIN_STUDENTS, Math.round(n)))

  return (
    <section className="bg-muted w-full rounded-3xl p-8 md:p-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {t?.title || "Estimate your monthly cost"}
        </h2>
        <p className="muted">
          {t?.subtitle ||
            "Drag the slider to your student count — see what you'd pay."}
        </p>

        <BillingToggle
          isYearly={isYearly}
          onChange={setIsYearly}
          dictionary={dictionary}
        />

        <div className="mt-4 flex w-full items-center gap-4">
          <Slider
            value={[count]}
            min={MIN_STUDENTS}
            max={MAX_STUDENTS}
            step={5}
            onValueChange={([v]) => setCount(clamp(v))}
            aria-label={t?.studentCountLabel || "Students"}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={MIN_STUDENTS}
              max={MAX_STUDENTS}
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

        <div className="mt-6 min-h-16">
          {isFreeRange ? (
            <p className="font-heading text-2xl font-bold">
              {t?.resultFree || "Free — $0/mo"}
            </p>
          ) : isEnterpriseRange ? (
            <div className="flex flex-col items-center gap-3">
              <p className="font-heading text-2xl font-bold">
                {t?.resultEnterprise || "Enterprise — custom pricing"}
              </p>
              <p className="muted">
                {fill(
                  t?.resultEnterpriseEstimate ||
                    "Estimated ~${amount}/mo — contact sales for a custom quote",
                  enterpriseEstimate
                )}
              </p>
              <Link
                href={
                  pricing?.enterprise?.contactHref ||
                  "mailto:contact@databayt.org?subject=Enterprise%20plan"
                }
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" })
                )}
              >
                {t?.talkToSales || "Talk to Sales"}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <p className="font-heading text-2xl font-bold">
                {fill(
                  isYearly
                    ? t?.resultProYearly || "Pro: ${amount}/mo billed annually"
                    : t?.resultPro || "Pro: ${amount}/mo",
                  proCost
                )}
              </p>
              {minimumApplies && pro.minimumMonthly && (
                <p className="muted text-xs">
                  {fill(
                    t?.minimumNote || "Pro has a ${amount}/mo minimum",
                    pro.minimumMonthly
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="muted mt-2 text-sm">
          {t?.example || "Example: 300 students on Pro is $450/mo."}
        </p>
      </div>
    </section>
  )
}
