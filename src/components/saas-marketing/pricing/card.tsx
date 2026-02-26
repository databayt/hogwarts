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
  isProTitle,
  isStarterTitle,
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
  const isPro = isProTitle(offer.title)
  const isStarter = isStarterTitle(offer.title)
  const priceDisplay = getPriceDisplay(offer, isYearly, pricing)

  const ctaArea = (
    <>
      {userId && subscriptionPlan ? (
        isStarter ? (
          <Link
            href={`/${lang}/dashboard`}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            {pricing?.constants?.startTrial || "Start trial"}
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
          href={(() => {
            const monthly = offer.stripeIds.monthly
            const yearly = offer.stripeIds.yearly
            const priceId = (isYearly ? yearly : monthly) || monthly
            return priceId
              ? `/${lang}/starter/dashboard/billing/checkout?price=${encodeURIComponent(priceId)}`
              : `/${lang}/starter/dashboard/billing`
          })()}
          className={cn(
            buttonVariants({
              variant: "default",
              size: "sm",
            }),
            "transition-transform hover:scale-[1.01]"
          )}
        >
          {getCtaLabel(offer.title, pricing)}
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

  const includesHeading = getIncludesHeading(offer.title, pricing)

  return (
    <Card
      key={offer.title}
      className={cn(
        "bg-muted text-card-foreground relative flex h-full w-full flex-col items-start overflow-hidden rounded-2xl border-none text-start shadow-none"
      )}
    >
      <CardHeader className="pb-4">
        <p className="lead text-foreground">{offer.title}</p>
        <CardTitle className="tracking-tight">
          {priceDisplay}
          <span className="muted ms-1">
            {offer.prices.monthly > 0
              ? pricing?.constants?.perMonth || "/mo"
              : ""}
          </span>
        </CardTitle>
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
