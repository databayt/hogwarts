"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import type { SubscriptionPlan } from "@/components/saas-marketing/pricing/types"

import { getCtaLabel, getIncludesHeading, isEnterprisePlan } from "./config"
import { useCurrency } from "./currency"
import {
  FALLBACK_RATES,
  formatAmount,
  RATE_TIERS,
  SIGNS,
  type RateTier,
} from "./rates"

interface PricingCardProps {
  offer: SubscriptionPlan
  /** A rate-tier card: the per-student rate, student range and live hours. */
  tier?: { rate: RateTier; min: number; liveHours?: number }
  lang?: Locale
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function PricingCard({
  offer,
  tier,
  lang = "en",
  dictionary,
}: PricingCardProps) {
  const pricing = dictionary?.marketing?.pricing
  const constants = pricing?.constants as Record<string, string> | undefined
  const { currency, rates } = useCurrency()
  const isEnterprise = isEnterprisePlan(offer.id)
  const contactHref =
    pricing?.enterprise?.contactHref ||
    "mailto:sales@databayt.org?subject=Enterprise%20plan"

  // Graduated per-student rates (rates.ts): each card shows its tier's rate
  // a year, in the visitor's currency. Enterprise is the last tier's rate
  // under its own contract.
  const fx = rates[currency] ?? FALLBACK_RATES[currency]
  const tierSar =
    tier?.rate.sarPerStudent ?? RATE_TIERS[RATE_TIERS.length - 1].sarPerStudent
  const amount = formatAmount(tierSar * fx)
  const fill = (t: string, v: Record<string, string>) =>
    Object.entries(v).reduce((a, [k, x]) => a.replaceAll(`{${k}}`, x), t)
  const n = (x: number) => x.toLocaleString("en-US")
  const title = tier
    ? tier.rate.upTo === null
      ? fill(constants?.tierOver || "{min}+ students", { min: n(tier.min) })
      : tier.min === 1
        ? fill(constants?.tierFirst || "First {max} students", {
            max: n(tier.rate.upTo),
          })
        : fill(constants?.tierRange || "Students {min}–{max}", {
            min: n(tier.min),
            max: n(tier.rate.upTo),
          })
    : offer.title
  const sign = SIGNS[currency]
  const signText = sign[lang === "ar" ? "ar" : "en"]
  const signLeads = !/[\u0600-\u06FF]/.test(signText)
  const signEl = (
    <span
      className={sign.riyal ? "font-[thmanyah_sans]" : undefined}
      aria-label={currency}
    >
      {signText}
    </span>
  )
  const priceSuffix = constants?.perStudentPerYear || "/ student / year"

  const includesHeading = getIncludesHeading(offer.id, pricing)

  return (
    <Card className="bg-muted text-card-foreground relative flex h-full w-full flex-col items-start gap-0 overflow-hidden rounded-2xl border-none py-4 text-start shadow-none">
      <CardHeader className="w-full gap-1 pb-2">
        <p className="lead text-foreground">{title}</p>
        <CardTitle className="tracking-tight whitespace-nowrap">
          <span className="text-2xl tabular-nums">
            {signLeads ? (
              <bdi dir="ltr">
                {signEl}
                {amount}
              </bdi>
            ) : (
              <>
                {amount} {signEl}
              </>
            )}
          </span>
          <span className="muted ms-1">{priceSuffix}</span>
        </CardTitle>
        <p className="muted text-sm">
          {constants?.freeNote || "Your first month, on us"}
        </p>
      </CardHeader>

      <div className="w-full px-6 py-1">
        <Separator />
      </div>

      <CardContent className="w-full flex-1 pt-3">
        <p className="text-muted-foreground mb-2 text-base">
          {includesHeading}
        </p>
        <ul>
          {tier?.liveHours ? (
            <li className="flex items-start gap-3">
              <Check className="text-primary mt-2 size-3.5 shrink-0" />
              <span className="text-muted-foreground text-base leading-7">
                {fill(
                  constants?.liveHours ||
                    "Live classes included: up to {hours} hours a month",
                  { hours: n(tier.liveHours) }
                )}
              </span>
            </li>
          ) : null}
          {offer.benefits.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="text-primary mt-2 size-3.5 shrink-0" />
              <span className="text-muted-foreground text-base leading-7">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="mt-auto w-full pt-4">
        <Link
          href={isEnterprise ? contactHref : `/${lang}/onboarding`}
          className={cn(
            buttonVariants({
              variant: isEnterprise ? "outline" : "default",
              size: "sm",
            }),
            "transition-transform hover:scale-[1.01]"
          )}
        >
          {getCtaLabel(offer.id, pricing)}
        </Link>
        <a href="#compare" className="ms-3">
          <small className="text-muted-foreground text-sm">
            {constants?.moreInfo || "More info"} ↗
          </small>
        </a>
      </CardFooter>
    </Card>
  )
}
