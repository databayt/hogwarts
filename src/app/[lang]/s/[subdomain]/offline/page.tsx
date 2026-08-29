// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { OfflineContent } from "@/components/offline/content"

/**
 * `/offline` — the library of lessons downloaded to this device, and the
 * page the service worker serves when a navigation cannot reach the
 * network. Rendered in the locale the middleware resolved; on a tenant host
 * the request is rewritten under `/s/[subdomain]/`, so the same page exists
 * at both roots. Public on purpose: it shows nothing from the server.
 */
export default async function OfflinePage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <OfflineContent dictionary={dictionary} lang={lang} />
}
