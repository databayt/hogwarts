"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { BillingToggle } from "./billing-toggle"
import { PricingCard } from "./card"
import { getPricingData } from "./config"

interface PricingCardsProps {
  lang?: Locale
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function PricingCards({
  lang = "en",
  dictionary: dictionaryProp,
}: PricingCardsProps) {
  // From the marketing layout's cached chunk — a prop here serialized the
  // whole dictionary into /pricing (~3 MB of HTML).
  const dictionary = useDictionaryFallback(dictionaryProp)
  const pricing = dictionary?.marketing?.pricing
  const plans = getPricingData(pricing)
  // Display only: one rate, shown per month or per year — no yearly discount.
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="flex w-full flex-col items-center text-center">
      <BillingToggle
        isYearly={isYearly}
        onChange={setIsYearly}
        dictionary={dictionary}
        className="mt-10 mb-4"
      />

      <div className="grid w-full items-stretch gap-6 bg-inherit py-4 md:grid-cols-3 md:gap-8">
        {plans.map((offer) => (
          <PricingCard
            offer={offer}
            key={offer.id}
            isYearly={isYearly}
            lang={lang}
            dictionary={dictionary}
          />
        ))}
      </div>
    </div>
  )
}
