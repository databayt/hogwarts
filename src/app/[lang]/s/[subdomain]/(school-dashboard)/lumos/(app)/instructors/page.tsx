// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { requireSettingsAccess } from "@/components/stream/settings/guard"
import { InstructorSettingsContent } from "@/components/stream/settings/instructor-settings"
import { getSubjectsWithInstructors } from "@/components/stream/settings/queries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function StreamInstructorsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await requireSettingsAccess(lang)

  const [dictionary, subjects] = await Promise.all([
    getDictionary(lang),
    schoolId ? getSubjectsWithInstructors(schoolId) : Promise.resolve([]),
  ])

  return (
    <InstructorSettingsContent
      dictionary={dictionary}
      lang={lang}
      subjects={subjects}
    />
  )
}
