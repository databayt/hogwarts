// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { requireSettingsAccess } from "@/components/lumos/settings/guard"
import { getPendingVideos } from "@/components/lumos/settings/video-review-actions"
import { VideoReviewContent } from "@/components/lumos/settings/video-review-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function LumosReviewPage({ params }: Props) {
  const { lang } = await params
  const { role } = await requireSettingsAccess(lang)

  // getPendingVideos self-guards role + school; the queue is the whole point
  // of this route, so it is fetched here rather than passed down as a prop
  // (the old prop wiring silently emptied this surface once).
  const [dictionary, pendingVideos] = await Promise.all([
    getDictionary(lang),
    getPendingVideos(),
  ])

  return (
    <VideoReviewContent
      videos={pendingVideos}
      userRole={role}
      lang={lang}
      dictionary={dictionary.lumos || {}}
    />
  )
}
