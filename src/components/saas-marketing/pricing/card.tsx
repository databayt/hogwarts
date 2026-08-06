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
import { BillingFormButton } from "@/components/saas-marketing/pricing/forms/billing-form-button"
import {
  SubscriptionPlan,
  UserSubscriptionPlan,
} from "@/components/saas-marketing/pricing/types"

import {
  getCtaLabel,
  getIncludesHeading,
  getPriceDisplay,
  getYearlyTotal,
  isEnterprisePlan,
  isFreePlan,
  isProPlan,
} from "./config"

interface PricingCardProps {
  offer: SubscriptionPlan
  isYearly: boolean
  userId?: string
  subscriptionPlan?: UserSubscriptionPlan
  userRole?: string
  lang?: Locale
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function PricingCard({
  offer,
  isYearly,
  userId,
  subscriptionPlan,
  userRole,
  lang,
  dictionary,
}: PricingCardProps) {
  const pricing = dictionary?.marketing?.pricing
  const isFree = isFreePlan(offer.id)
  const isPro = isProPlan(offer.id)
  const isEnterprise = isEnterprisePlan(offer.id)
  const priceDisplay = getPriceDisplay(offer, isYearly, pricing)
  const contactHref =
    pricing?.enterprise?.contactHref ||
    "mailto:contact@databayt.org?subject=Enterprise%20plan"

  const priceSuffix =
    !isEnterprise && offer.prices.monthly > 0
      ? pricing?.constants?.perStudentPerMonth || "/ student / month"
      : ""

  const minimumNote =
    isPro && offer.minimumMonthly
      ? (pricing?.constants?.minimumNote || "${amount}/mo minimum").replace(
          "{amount}",
          String(offer.minimumMonthly)
        )
      : null

  const yearlyNote =
    isPro && isYearly
      ? (
          pricing?.constants?.billedAnnuallyNote ||
          "billed annually at ${amount}/student/year"
        ).replace("{amount}", getYearlyTotal(offer).toFixed(2))
      : null

  const ctaArea = isEnterprise ? (
    <Link
      href={contactHref}
      className={cn(buttonVariants({ variant: "outline" }))}
    >
      {getCtaLabel(offer.id, pricing)}
    </Link>
  ) : (
    <>
      {userId && subscriptionPlan ? (
        isFree ? (
          <Link
            href={`/${lang}/dashboard`}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            {pricing?.constants?.startTrial || "Get started free"}
          </Link>
        ) : (
          <BillingFormButton
            year={isYearly}
            offer={offer}
            subscriptionPlan={subscriptionPlan}
            userRole={userRole as any}
            dictionary={dictionary}
          />
        )
      ) : (
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
      )}
      {(!userId || !subscriptionPlan) && isPro && (
        <a href="#more-info" className="ms-3">
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
          {priceDisplay}
          {priceSuffix && <span className="muted ms-1">{priceSuffix}</span>}
        </CardTitle>
        <p className="muted">{offer.description}</p>
        {(minimumNote || yearlyNote) && (
          <p className="muted text-xs">
            {[minimumNote, yearlyNote].filter(Boolean).join(" · ")}
          </p>
        )}
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
