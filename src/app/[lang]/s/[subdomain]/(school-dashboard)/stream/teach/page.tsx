// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTeacherStats } from "@/components/stream/teach/actions"
import { TeachOverviewContent } from "@/components/stream/teach/overview-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TeachPage({ params }: Props) {
  const { lang, subdomain } = await params
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  if (
    !session?.user ||
    !["TEACHER", "ADMIN", "DEVELOPER"].includes(session.user.role || "")
  ) {
    redirect(`/${lang}/s/${subdomain}/stream/courses`)
  }

  const stats = await getTeacherStats()

  return (
    <TeachOverviewContent
      dictionary={dictionary.stream || {}}
      lang={lang}
      stats={stats}
      subdomain={subdomain}
    />
  )
}
