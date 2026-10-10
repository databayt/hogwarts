"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { PricingCard } from "./card"
import { getPricingData } from "./config"
import { CurrencyToggle } from "./currency"

interface PricingCardsProps {
  lang?: Locale
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function PricingCards({ lang = "en", dictionary }: PricingCardsProps) {
  const pricing = dictionary?.marketing?.pricing
  const plans = getPricingData(pricing)
  const calculator = pricing?.calculator as Record<string, string> | undefined

  return (
    <div className="flex w-full flex-col items-center text-center">
      <CurrencyToggle
        locale={lang}
        label={calculator?.currencyLabel || "Currency"}
        className="mt-10 mb-4"
      />

      <div className="grid w-full items-stretch gap-6 bg-inherit py-4 md:grid-cols-3 md:gap-8">
        {plans.map((offer) => (
          <PricingCard
            offer={offer}
            key={offer.id}
            lang={lang}
            dictionary={dictionary}
          />
        ))}
      </div>
    </div>
  )
}
