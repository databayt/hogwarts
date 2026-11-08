// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { PricingChatbotNudge } from "@/components/chatbot/pricing-nudge"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PricingContent from "@/components/saas-marketing/pricing/content"

// The page's only moving input is the day's exchange rates (fetched with
// `revalidate: 86400` in pricing/exchange-rates.ts). Prerender it and refresh
// it once a day instead of rendering it on every request.
export const revalidate = 86400

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary.marketing.pricing
  return {
    title: lang === "ar" ? `التسعير — ${t.title}` : `Pricing — ${t.title}`,
    description: t.subtitle,
  }
}

export default async function Pricing({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PricingContent dictionary={dictionary} lang={lang} />
      <PricingChatbotNudge />
    </>
  )
}
