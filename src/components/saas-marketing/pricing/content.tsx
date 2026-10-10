// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { ComparePlans } from "@/components/saas-marketing/pricing/compare-plans"
import { PricingCards } from "@/components/saas-marketing/pricing/pricing-cards"

import { ImmersiveHero } from "../immersive-hero"
import { Calculator } from "./calculator"
import { CurrencyProvider } from "./currency"
import EnterpriseSection from "./enterprise-section"
import { getExchangeRates } from "./exchange-rates"
import PricingFAQs from "./pricing-faqs"
import PricingHeader from "./pricing-header"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default async function PricingContent(props: Props) {
  const { lang, dictionary } = props
  // Live SAR → USD/SDG/EGP, cached a day; falls back to pinned rates.
  const { rates, updated } = await getExchangeRates()

  return (
    <div className="flex w-full flex-col items-center py-14">
      <ImmersiveHero className="-mt-8 flex w-full justify-center pt-8">
        <PricingHeader dictionary={dictionary} />
      </ImmersiveHero>
      <CurrencyProvider rates={rates} updated={updated}>
        <PricingCards lang={lang} dictionary={dictionary} />
        <div id="calculator" className="w-full scroll-mt-24">
          <Calculator lang={lang} dictionary={dictionary} />
        </div>
      </CurrencyProvider>
      <ComparePlans dictionary={dictionary} />
      <PricingFAQs dictionary={dictionary} />
      <EnterpriseSection lang={lang} dictionary={dictionary} />
    </div>
  )
}
