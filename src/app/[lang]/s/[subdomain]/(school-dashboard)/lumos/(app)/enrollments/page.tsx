// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getSchoolEnrollments } from "@/components/stream/settings/enrollments/actions"
import { EnrollmentsContent } from "@/components/stream/settings/enrollments/content"
import { requireSettingsAccess } from "@/components/stream/settings/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function StreamEnrollmentsPage({ params }: Props) {
  const { lang } = await params
  await requireSettingsAccess(lang)

  const [dictionary, enrollments] = await Promise.all([
    getDictionary(lang),
    getSchoolEnrollments(),
  ])

  return (
    <EnrollmentsContent
      dictionary={dictionary.stream || {}}
      lang={lang}
      enrollments={enrollments}
    />
  )
}
