// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"

import { Chatbot } from "@/components/chatbot"
import { type Locale } from "@/components/internationalization/config"
import {
  getPlatformCoreDictionary,
  type Dictionary,
} from "@/components/internationalization/dictionaries"
import { LocaleDictionaryProvider } from "@/components/internationalization/locale-dictionary-provider"
import { AccessCheck } from "@/components/saas-marketing/access-check"
import { SiteFooter } from "@/components/template/marketing-header/site-footer"
import { SiteHeader } from "@/components/template/marketing-header/site-header"

interface MarketingLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function MarketingLayout({
  children,
  params,
}: MarketingLayoutProps) {
  const { lang } = await params
  // Marketing subtree consumes general + school (UserRoleForm) + messages
  // (LetsWorkTogether) — getPlatformCoreDictionary covers all three and
  // sheds lumos + the 18 unused feature namespaces from the RSC payload.
  const dictionary = (await getPlatformCoreDictionary(
    lang as Locale
  )) as Dictionary

  // Client components read the dictionary from a static per-locale chunk,
  // not a prop: as a prop it was ~0.5 MB of JSON inside every marketing and
  // docs page (see internationalization/CLAUDE.md).
  return (
    <LocaleDictionaryProvider lang={lang}>
      {/* No full-screen loader and no phone "immersive" unpinning: the page
          paints straight from the server HTML, and the sticky header is on
          screen from the first frame at every breakpoint. The 0→100% loader
          held the whole tree — header included — at visibility:hidden until
          hydration, which was the largest LCP cost on these pages. */}
      <div className="marketing-container flex min-h-screen flex-col">
        <Suspense fallback={null}>
          <AccessCheck />
        </Suspense>
        <SiteHeader dictionary={dictionary} locale={lang} />
        <main className="flex-1">{children}</main>
        <SiteFooter dictionary={dictionary} locale={lang} />
        <Chatbot lang={lang as Locale} promptType="saasMarketing" />
      </div>
    </LocaleDictionaryProvider>
  )
}
