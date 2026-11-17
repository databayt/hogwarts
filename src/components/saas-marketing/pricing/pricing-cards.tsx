"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { PricingCard } from "./card"
import { getPricingData } from "./config"
import { LIVE_HOURS, RATE_TIERS } from "./rates"

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
  // One card per graduated rate tier (first 250 / 251–500 / 501+), then
  // Enterprise. The "pro" plan carries the shared benefits; the free month is
  // noted on the tiers, not sold as a card.
  const pro = plans.find((p) => p.id === "pro")!
  const enterprise = plans.find((p) => p.id === "enterprise")!
  const tiers = RATE_TIERS.slice(0, 3).map((rate, i) => {
    const prev = i === 0 ? null : RATE_TIERS[i - 1].upTo
    const min = (prev ?? 0) + 1
    const hours = LIVE_HOURS.find((h) => h.upTo === rate.upTo)?.hours
    return {
      rate: i === 2 ? { ...rate, upTo: null } : rate,
      min,
      liveHours: hours,
    }
  })

  return (
    <div className="flex w-full flex-col items-center text-center">
      <div className="mt-10 grid w-full items-stretch gap-6 bg-inherit py-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {tiers.map((tier) => (
          <PricingCard
            offer={pro}
            key={tier.min}
            tier={tier}
            lang={lang}
            dictionary={dictionary}
          />
        ))}
        <PricingCard offer={enterprise} lang={lang} dictionary={dictionary} />
      </div>
    </div>
  )
}
