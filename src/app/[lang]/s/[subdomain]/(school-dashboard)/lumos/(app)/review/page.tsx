// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { requireSettingsAccess } from "@/components/lumos/settings/guard"
import { getSubmittedVideos } from "@/components/lumos/settings/video-review-actions"
import { VideoReviewContent } from "@/components/lumos/settings/video-review-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function LumosReviewPage({ params }: Props) {
  const { lang } = await params
  await requireSettingsAccess(lang)

  // getSubmittedVideos self-guards role + school; the feed is the whole point
  // of this route, so it is fetched here rather than passed down as a prop
  // (the old prop wiring silently emptied this surface once).
  const [dictionary, submittedVideos] = await Promise.all([
    getDictionary(lang),
    getSubmittedVideos(),
  ])

  return (
    <VideoReviewContent
      videos={submittedVideos}
      lang={lang}
      dictionary={dictionary.lumos || {}}
    />
  )
}
