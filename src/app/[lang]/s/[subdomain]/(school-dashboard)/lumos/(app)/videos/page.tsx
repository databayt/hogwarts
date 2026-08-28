// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { requireSettingsAccess } from "@/components/lumos/settings/guard"
import { getMyVideos } from "@/components/lumos/teach/actions"
import { getProposableCatalog } from "@/components/lumos/teach/get-proposable-lessons"
import { getSchoolCurrency } from "@/components/lumos/teach/school-currency"
import { TeachVideosContent } from "@/components/lumos/teach/videos-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function LumosVideosPage({ params }: Props) {
  const { lang, subdomain } = await params
  // ADMIN / DEVELOPER / TEACHER all upload and manage videos here.
  await requireSettingsAccess(lang, { teacherAllowed: true })

  const [dictionary, videos, proposableGrades, currency] = await Promise.all([
    getDictionary(lang),
    getMyVideos(),
    getProposableCatalog(lang),
    getSchoolCurrency(),
  ])

  return (
    <TeachVideosContent
      dictionary={dictionary.lumos || {}}
      lang={lang}
      videos={videos}
      subdomain={subdomain}
      proposableGrades={proposableGrades}
      currency={currency}
    />
  )
}
