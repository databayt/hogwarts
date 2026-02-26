// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { i18n } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { OfflineContent } from "@/components/offline/content"

// Note: This page is intentionally outside [lang] folder as it's a special offline fallback
// We use the default locale for consistency
export default async function Offline() {
  const dictionary = await getDictionary(i18n.defaultLocale)

  return <OfflineContent dictionary={dictionary} lang={i18n.defaultLocale} />
}
