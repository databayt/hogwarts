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
import { formatAmount, quote, SIGNS } from "./rates"

interface PricingCardProps {
  offer: SubscriptionPlan
  isYearly: boolean
  lang?: Locale
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function PricingCard({
  offer,
  isYearly,
  lang = "en",
  dictionary,
}: PricingCardProps) {
  const pricing = dictionary?.marketing?.pricing
  const constants = pricing?.constants as Record<string, string> | undefined
  const { currency, rates } = useCurrency()
  const isEnterprise = isEnterprisePlan(offer.id)
  const isFree = offer.prices.monthly === 0 && !isEnterprise
  const contactHref =
    pricing?.enterprise?.contactHref ||
    "mailto:sales@databayt.org?subject=Enterprise%20plan"

  // One rate for every paid student (rates.ts) — the cards differ in what
  // comes with it, not in what a student costs. The toggle only changes
  // whether that rate reads per month or per year.
  const { ratePerStudentYear } = quote(0, currency, rates)
  const rate = isYearly ? ratePerStudentYear : ratePerStudentYear / 12
  const amount = formatAmount(isFree ? 0 : rate)
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
  const priceSuffix = isYearly
    ? constants?.perStudentPerYear || "/ student / year"
    : constants?.perStudentPerMonth || "/ student / month"

  const includesHeading = getIncludesHeading(offer.id, pricing)

  return (
    <Card className="bg-muted text-card-foreground relative flex h-full w-full flex-col items-start gap-0 overflow-hidden rounded-2xl border-none py-4 text-start shadow-none">
      <CardHeader className="w-full gap-1 pb-2">
        <p className="lead text-foreground">{offer.title}</p>
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
      </CardHeader>

      <div className="w-full px-6 py-1">
        <Separator />
      </div>

      <CardContent className="w-full flex-1 pt-3">
        <p className="text-muted-foreground mb-2 text-base">
          {includesHeading}
        </p>
        <ul>
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
