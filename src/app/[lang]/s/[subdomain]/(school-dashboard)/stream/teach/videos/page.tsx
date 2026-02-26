// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getMyVideos } from "@/components/stream/teach/actions"
import { TeachVideosContent } from "@/components/stream/teach/videos-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TeachVideosPage({ params }: Props) {
  const { lang, subdomain } = await params
  const session = await auth()
  const dictionary = await getDictionary(lang)

  if (
    !session?.user ||
    !["TEACHER", "ADMIN", "DEVELOPER"].includes(session.user.role || "")
  ) {
    redirect(`/${lang}/s/${subdomain}/stream/courses`)
  }

  const videos = await getMyVideos()

  return (
    <TeachVideosContent
      dictionary={dictionary.stream || {}}
      lang={lang}
      videos={videos}
      subdomain={subdomain}
    />
  )
}
