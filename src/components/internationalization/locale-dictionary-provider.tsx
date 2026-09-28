"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import dynamic from "next/dynamic"

import type { Locale } from "./config"

/**
 * Provides the whole dictionary to client components without serializing it.
 *
 * `<DictionaryProvider dictionary={…}>` takes the dictionary as a prop, and a
 * prop to a client component is serialized into the RSC payload: ~1.3 MB of
 * Arabic JSON inside every dashboard document, and inside every Server Action
 * response that re-renders the page — which every save does. Here the JSON is
 * a static import of a client module instead: a hashed, immutable chunk the
 * edge and the service worker cache, downloaded once per deploy.
 *
 * Each locale is its own `next/dynamic` chunk. Imported statically, both
 * providers landed in the layout's shared chunk group, so an Arabic page
 * downloaded the English dictionary too. As dynamic modules, a page only
 * references the one it renders, and `next/dynamic` preloads that chunk during
 * SSR (`PreloadChunks` → `ReactDOM.preload`), so it arrives beside the page's
 * other scripts instead of after hydration starts. SSR renders the provider
 * with its dictionary, so there is no flash.
 */
const DictionaryProviderAr = dynamic(() =>
  import("./client/provider-ar").then((m) => m.DictionaryProviderAr)
)
const DictionaryProviderEn = dynamic(() =>
  import("./client/provider-en").then((m) => m.DictionaryProviderEn)
)

export function LocaleDictionaryProvider({
  lang,
  children,
}: {
  lang: Locale | string
  children: React.ReactNode
}) {
  return lang === "en" ? (
    <DictionaryProviderEn>{children}</DictionaryProviderEn>
  ) : (
    <DictionaryProviderAr>{children}</DictionaryProviderAr>
  )
}
