// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { requireSettingsAccess } from "@/components/stream/settings/guard"
import { getMyVideos } from "@/components/stream/teach/actions"
import { getProposableCatalog } from "@/components/stream/teach/get-proposable-lessons"
import { TeachVideosContent } from "@/components/stream/teach/videos-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function StreamVideosPage({ params }: Props) {
  const { lang, subdomain } = await params
  // ADMIN / DEVELOPER / TEACHER all upload and manage videos here.
  await requireSettingsAccess(lang, { teacherAllowed: true })

  const [dictionary, videos, proposableGrades] = await Promise.all([
    getDictionary(lang),
    getMyVideos(),
    getProposableCatalog(lang),
  ])

  return (
    <TeachVideosContent
      dictionary={dictionary.stream || {}}
      lang={lang}
      videos={videos}
      subdomain={subdomain}
      proposableGrades={proposableGrades}
    />
  )
}
