// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

/**
 * Localized "Access Denied" panel shared by every role-gated attendance route.
 *
 * Server component: it loads the attendance dictionary itself from `lang`, so a
 * page only needs `return <AttendanceAccessDenied lang={lang} />` instead of a
 * hardcoded English block. Falls back to English if a key is missing.
 */
export async function AttendanceAccessDenied({ lang }: { lang: Locale }) {
  const dictionary = await getDictionary(lang)
  const t = (
    dictionary as unknown as {
      attendance?: { accessDenied?: { title?: string; description?: string } }
    }
  )?.attendance?.accessDenied

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h2>{t?.title || "Access Denied"}</h2>
      <p className="text-muted-foreground">
        {t?.description ||
          "You do not have permission to access this page."}
      </p>
    </div>
  )
}
