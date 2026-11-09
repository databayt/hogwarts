// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { ComparePlans } from "@/components/saas-marketing/pricing/compare-plans"
import { PricingCards } from "@/components/saas-marketing/pricing/pricing-cards"

import { CurrencyProvider } from "./currency"
import EnterpriseSection from "./enterprise-section"
import { getExchangeRates } from "./exchange-rates"
import PricingFAQs from "./pricing-faqs"
import PricingHeader from "./pricing-header"
import { SecurePayment } from "./secure-payment"

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
      <div className="flex w-full justify-center">
        <PricingHeader dictionary={dictionary} lang={lang} />
      </div>
      <CurrencyProvider rates={rates} updated={updated}>
        <PricingCards lang={lang} />
      </CurrencyProvider>
      <ComparePlans dictionary={dictionary} />
      <SecurePayment dictionary={dictionary} />
      <PricingFAQs dictionary={dictionary} lang={lang} />
      <EnterpriseSection lang={lang} dictionary={dictionary} />
    </div>
  )
}
