// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { Chatbot } from "@/components/chatbot"
import { type Locale } from "@/components/internationalization/config"
import {
  getPlatformCoreDictionary,
  type Dictionary,
} from "@/components/internationalization/dictionaries"
import { MarketingDictionaryProvider } from "@/components/internationalization/marketing-dictionary-provider"
import { ContactBlock } from "@/components/saas-marketing/thmanyah/block/ContactBlock"
import { HomeHeader } from "@/components/saas-marketing/thmanyah/block/HomeHeader"

/**
 * /contact — the "talk to a human" page: one green screen styled like the
 * homepage hero (see ContactBlock). It lives in the `(thmanyah)` group with
 * the homepage, not under `(saas-marketing)`, so it gets the same chrome:
 * HomeHeader transparent over the green, and no SiteFooter.
 */
export async function generateMetadata(props: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await props.params
  const ar = lang !== "en"
  return {
    title: ar ? "تواصل معنا — بالقلم" : "Contact — balqalam",
    description: ar
      ? "تحدث مع فريق بالقلم على واتساب أو اترك رسالة."
      : "Talk to the balqalam team on WhatsApp or leave a message.",
  }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = (lang === "en" ? "en" : "ar") as Locale
  const dictionary = (await getPlatformCoreDictionary(locale)) as Dictionary

  return (
    <MarketingDictionaryProvider lang={locale}>
      <HomeHeader dictionary={dictionary} locale={locale} />
      {/* Full-bleed: escape the root .layout-container gutter, the same
          trick as .thmanyah-shell in thmanyah-clone.css. */}
      <main className="mx-[calc(-1*var(--container-px,0px))]">
        <ContactBlock lang={locale} />
      </main>
      <Chatbot lang={locale} promptType="saasMarketing" />
    </MarketingDictionaryProvider>
  )
}
