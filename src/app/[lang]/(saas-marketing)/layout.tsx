// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"

import { Chatbot } from "@/components/chatbot"
import { type Locale } from "@/components/internationalization/config"
import {
  getPlatformCoreDictionary,
  type Dictionary,
} from "@/components/internationalization/dictionaries"
import { DictionaryProvider } from "@/components/internationalization/dictionary-context"
import { LoadingWrapper } from "@/components/marketing/loading"
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
  // sheds stream + the 18 unused feature namespaces from the RSC payload.
  const dictionary = (await getPlatformCoreDictionary(
    lang as Locale
  )) as Dictionary

  return (
    <DictionaryProvider dictionary={dictionary}>
      <LoadingWrapper>
        <div className="marketing-container flex min-h-screen flex-col">
          <Suspense fallback={null}>
            <AccessCheck />
          </Suspense>
          <SiteHeader dictionary={dictionary} locale={lang} />
          <main className="flex-1">{children}</main>
          <SiteFooter dictionary={dictionary} locale={lang} />
          <Chatbot lang={lang as Locale} promptType="saasMarketing" />
        </div>
      </LoadingWrapper>
    </DictionaryProvider>
  )
}
