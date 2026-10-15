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
import { ENTERPRISE_STUDENTS, formatMoney, FREE_STUDENTS, quote } from "./rates"

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
    "mailto:contact@databayt.org?subject=Enterprise%20plan"

  // One rate for every paid student (rates.ts) — the cards differ in what
  // comes with it, not in what a student costs. The toggle only changes
  // whether that rate reads per month or per year.
  const { ratePerStudentYear } = quote(0, currency, rates)
  const rate = isYearly ? ratePerStudentYear : ratePerStudentYear / 12
  const priceDisplay = formatMoney(isFree ? 0 : rate, currency, lang)
  const priceSuffix = isYearly
    ? constants?.perStudentPerYear || "/ student / year"
    : constants?.perStudentPerMonth || "/ student / month"

  // Every card carries the same four header rows; the note is the 4th.
  const note = isFree
    ? (constants?.freeNote || "First {free} students, forever").replace(
        "{free}",
        String(FREE_STUDENTS)
      )
    : isEnterprise
      ? (constants?.enterpriseNote || "For {students}+ students").replace(
          "{students}",
          ENTERPRISE_STUDENTS.toLocaleString("en-US")
        )
      : (constants?.proNote || "Only for students beyond {free}").replace(
          "{free}",
          String(FREE_STUDENTS)
        )

  const includesHeading = getIncludesHeading(offer.id, pricing)

  return (
    <Card className="bg-muted text-card-foreground relative flex h-full w-full flex-col items-start gap-0 overflow-hidden rounded-2xl border-none py-4 text-start shadow-none">
      <CardHeader className="w-full gap-1 pb-2">
        <p className="lead text-foreground">{offer.title}</p>
        <CardTitle className="tracking-tight whitespace-nowrap">
          <span className="tabular-nums">{priceDisplay}</span>
          <span className="muted ms-1">{priceSuffix}</span>
        </CardTitle>
        <p className="muted line-clamp-1">{offer.description}</p>
        <p className="muted line-clamp-1 text-xs">{note}</p>
      </CardHeader>

      <div className="w-full px-6 py-1">
        <Separator />
      </div>

      <CardContent className="w-full flex-1 pt-3">
        <p className="muted mb-2">{includesHeading}</p>
        <ul>
          {offer.benefits.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="text-primary mt-1.5 size-3 shrink-0" />
              <span className="muted leading-6">{feature}</span>
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
        <a href="#calculator" className="ms-3">
          <small className="muted">
            {constants?.moreInfo || "More info"} ↗
          </small>
        </a>
      </CardFooter>
    </Card>
  )
}
