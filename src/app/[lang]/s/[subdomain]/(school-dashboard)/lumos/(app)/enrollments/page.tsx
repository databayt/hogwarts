// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getSchoolEnrollments } from "@/components/lumos/settings/enrollments/actions"
import { EnrollmentsContent } from "@/components/lumos/settings/enrollments/content"
import { requireSettingsAccess } from "@/components/lumos/settings/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function LumosEnrollmentsPage({ params }: Props) {
  const { lang } = await params
  await requireSettingsAccess(lang)

  const [dictionary, enrollments] = await Promise.all([
    getDictionary(lang),
    getSchoolEnrollments(),
  ])

  return (
    <EnrollmentsContent
      dictionary={dictionary.lumos || {}}
      lang={lang}
      enrollments={enrollments}
    />
  )
}
