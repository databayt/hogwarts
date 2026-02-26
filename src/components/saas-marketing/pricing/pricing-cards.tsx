"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"

import { HeaderSection } from "@/components/atom/header-section"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import MaxWidthWrapper from "@/components/saas-marketing/pricing/shared/max-width-wrapper"
import { UserSubscriptionPlan } from "@/components/saas-marketing/pricing/types"

import { BillingToggle } from "./billing-toggle"
import { PricingCard } from "./card"
import { getPricingData, pricingData } from "./config"

interface PricingCardsProps {
  userId?: string
  subscriptionPlan?: UserSubscriptionPlan
  userRole?: string
  lang?: Locale
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function PricingCards({
  userId,
  subscriptionPlan,
  userRole,
  lang,
  dictionary,
}: PricingCardsProps) {
  // Default to monthly on initial render
  const [isYearly, setIsYearly] = useState<boolean>(false)

  const toggleBilling = (next: boolean) => setIsYearly(next)

  const plans = getPricingData(dictionary?.marketing?.pricing)

  // Card UI broken into `./card` component

  return (
    <div className="flex w-full flex-col items-center text-center">
      {/* <HeaderSection label="Pricing" title="Start at full speed !" /> */}

      <BillingToggle
        isYearly={isYearly}
        onChange={toggleBilling}
        dictionary={dictionary}
      />

      <div className="grid w-full items-stretch gap-6 bg-inherit py-4 md:grid-cols-3 md:gap-8">
        {plans.map((offer) => (
          <PricingCard
            offer={offer}
            key={offer.title}
            isYearly={isYearly}
            userId={userId}
            subscriptionPlan={subscriptionPlan}
            userRole={userRole}
            lang={lang}
            dictionary={dictionary}
          />
        ))}
      </div>
    </div>
  )
}
