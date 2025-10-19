"use client";

import { useState } from "react";

import { UserSubscriptionPlan } from "@/components/marketing/pricing/types";
import { pricingData } from "./config";
import { BillingToggle } from "./billing-toggle";
import { HeaderSection } from "@/components/atom/header-section";
import MaxWidthWrapper from "@/components/marketing/pricing/shared/max-width-wrapper";
import { PricingCard } from "./card";
import type { Locale } from "@/components/internationalization/config";

interface PricingCardsProps {
  userId?: string;
  subscriptionPlan?: UserSubscriptionPlan;
  userRole?: string;
  lang?: Locale;
}

export function PricingCards({ userId, subscriptionPlan, userRole, lang }: PricingCardsProps) {
  // Default to monthly on initial render
  const [isYearly, setIsYearly] = useState<boolean>(false);

  const toggleBilling = (next: boolean) => setIsYearly(next);

  // Card UI broken into `./card` component

  return (
    
      <div className="w-full flex flex-col items-center text-center">
        {/* <HeaderSection label="Pricing" title="Start at full speed !" /> */}

        <BillingToggle isYearly={isYearly} onChange={toggleBilling} />

        <div className="grid gap-6 md:gap-8 bg-inherit py-4 md:grid-cols-3 items-stretch w-full">
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

  );
}
