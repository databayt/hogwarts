// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAnnouncement } from "@/components/school-dashboard/listings/announcements/actions"
import { AnnouncementDetailContent } from "@/components/school-dashboard/listings/announcements/detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { lang, id } = await params
  // Independent of each other — don't make the announcement wait on the dictionary.
  const [dictionary, result] = await Promise.all([
    getDictionary(lang),
    getAnnouncement({ id, displayLang: lang }),
  ])

  return (
    <AnnouncementDetailContent
      data={result.success ? result.data : null}
      error={result.success ? null : result.error}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
