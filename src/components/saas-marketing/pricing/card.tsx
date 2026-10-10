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

import { useCurrency } from "./currency"
import { getCtaLabel, getIncludesHeading, isEnterprisePlan } from "./config"
import {
  ENTERPRISE_STUDENTS,
  FREE_STUDENTS,
  formatMoney,
  quote,
} from "./rates"

interface PricingCardProps {
  offer: SubscriptionPlan
  lang?: Locale
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function PricingCard({ offer, lang = "en", dictionary }: PricingCardProps) {
  const pricing = dictionary?.marketing?.pricing
  const constants = pricing?.constants as Record<string, string> | undefined
  const { currency, rates } = useCurrency()
  const isEnterprise = isEnterprisePlan(offer.id)
  const isFree = offer.prices.monthly === 0 && !isEnterprise
  const contactHref =
    pricing?.enterprise?.contactHref ||
    "mailto:contact@databayt.org?subject=Enterprise%20plan"

  // One rate for every paid student (rates.ts) — the cards differ in what
  // comes with it, not in what a student costs.
  const { ratePerStudentYear } = quote(0, currency, rates)
  const money = (n: number) => formatMoney(n, currency, lang)
  const priceDisplay = isFree ? money(0) : money(ratePerStudentYear)
  const priceSuffix = isFree
    ? ""
    : constants?.perStudentPerYear || "/ student / year"
  const note = isFree
    ? (constants?.freeNote || "Your first {free} students, forever").replace(
        "{free}",
        String(FREE_STUDENTS)
      )
    : isEnterprise
      ? (
          constants?.enterpriseNote ||
          "Same rate for {students}+ students, with a dedicated contract"
        ).replace("{students}", ENTERPRISE_STUDENTS.toLocaleString("en-US"))
      : (
          constants?.perMonthNote ||
          "≈ {amount} a month per student, beyond the first {free} free"
        )
          .replace("{amount}", money(ratePerStudentYear / 12))
          .replace("{free}", String(FREE_STUDENTS))

  const ctaArea = isEnterprise ? (
    <Link
      href={contactHref}
      className={cn(buttonVariants({ variant: "outline" }))}
    >
      {getCtaLabel(offer.id, pricing)}
    </Link>
  ) : (
    <>
      <Link
        href={`/${lang}/onboarding`}
        className={cn(
          buttonVariants({
            variant: "default",
            size: "sm",
          }),
          "transition-transform hover:scale-[1.01]"
        )}
      >
        {getCtaLabel(offer.id, pricing)}
      </Link>
      {!isFree && (
        <a href="#calculator" className="ms-3">
          <small className="muted">
            {pricing?.constants?.moreInfo || "More info"} ↗
          </small>
        </a>
      )}
    </>
  )

  const includesHeading = getIncludesHeading(offer.id, pricing)

  return (
    <Card
      key={offer.id}
      className={cn(
        "bg-muted text-card-foreground relative flex h-full w-full flex-col items-start overflow-hidden rounded-2xl border-none text-start shadow-none"
      )}
    >
      <CardHeader className="pb-4">
        <p className="lead text-foreground">{offer.title}</p>
        <CardTitle className="tracking-tight">
          <span className="tabular-nums">{priceDisplay}</span>
          {priceSuffix && <span className="muted ms-1">{priceSuffix}</span>}
        </CardTitle>
        <p className="muted">{offer.description}</p>
        <p className="muted text-xs">{note}</p>
      </CardHeader>
      <div className="w-full px-6 py-2">
        <Separator />
      </div>

      <CardContent className="flex-1 pt-4">
        <p className="muted mb-2">{includesHeading}</p>
        <ul>
          {offer.benefits.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="text-primary mt-1 size-3" />
              <span className="muted leading-6">{feature}</span>
            </li>
          ))}
          {/* limitations intentionally not rendered */}
        </ul>
      </CardContent>

      <CardFooter className="">{ctaArea}</CardFooter>
    </Card>
  )
}
