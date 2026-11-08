"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import dynamic from "next/dynamic"

import type { Locale } from "./config"

/**
 * LocaleDictionaryProvider for the SaaS marketing pages: the same static,
 * per-locale chunk design (see locale-dictionary-provider.tsx), but the chunk
 * holds only the general dictionary file. Marketing client components read
 * nothing outside it, and the full merged dictionary was the heaviest thing
 * a first visit to balqalam.com downloaded.
 */
const MarketingDictionaryProviderAr = dynamic(() =>
  import("./client/marketing-provider-ar").then(
    (m) => m.MarketingDictionaryProviderAr
  )
)
const MarketingDictionaryProviderEn = dynamic(() =>
  import("./client/marketing-provider-en").then(
    (m) => m.MarketingDictionaryProviderEn
  )
)

export function MarketingDictionaryProvider({
  lang,
  children,
}: {
  lang: Locale | string
  children: React.ReactNode
}) {
  return lang === "en" ? (
    <MarketingDictionaryProviderEn>{children}</MarketingDictionaryProviderEn>
  ) : (
    <MarketingDictionaryProviderAr>{children}</MarketingDictionaryProviderAr>
  )
}
