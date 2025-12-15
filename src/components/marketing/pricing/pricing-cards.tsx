"use client"

import { useState } from "react"

import { HeaderSection } from "@/components/atom/header-section"
import type { Locale } from "@/components/internationalization/config"
import MaxWidthWrapper from "@/components/marketing/pricing/shared/max-width-wrapper"
import { UserSubscriptionPlan } from "@/components/marketing/pricing/types"

import { BillingToggle } from "./billing-toggle"
import { PricingCard } from "./card"
import { pricingData } from "./config"

interface PricingCardsProps {
  userId?: string
  subscriptionPlan?: UserSubscriptionPlan
  userRole?: string
  lang?: Locale
}

export function PricingCards({
  userId,
  subscriptionPlan,
  userRole,
  lang,
}: PricingCardsProps) {
  // Default to monthly on initial render
  const [isYearly, setIsYearly] = useState<boolean>(false)

  const toggleBilling = (next: boolean) => setIsYearly(next)

  // Card UI broken into `./card` component

  return (
    <div className="flex w-full flex-col items-center text-center">
      {/* <HeaderSection label="Pricing" title="Start at full speed !" /> */}

      <BillingToggle isYearly={isYearly} onChange={toggleBilling} />

      <div className="grid w-full items-stretch gap-6 bg-inherit py-4 md:grid-cols-3 md:gap-8">
        {pricingData.map((offer) => (
          <PricingCard
            offer={offer}
            key={offer.title}
            isYearly={isYearly}
            userId={userId}
            subscriptionPlan={subscriptionPlan}
            userRole={userRole}
            lang={lang}
          />
        ))}
      </div>
    </div>
  )
}
