// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { requireSettingsAccess } from "@/components/lumos/settings/guard"
import { InstructorSettingsContent } from "@/components/lumos/settings/instructor-settings"
import {
  getInstructorRoster,
  type InstructorRoster,
} from "@/components/lumos/settings/queries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function LumosInstructorsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await requireSettingsAccess(lang)

  const emptyRoster: InstructorRoster = {
    rows: [],
    totalLessons: 0,
    ownSchool: null,
    lockedKey: null,
    defaultKey: null,
  }

  const [dictionary, roster] = await Promise.all([
    getDictionary(lang),
    schoolId ? getInstructorRoster(schoolId) : Promise.resolve(emptyRoster),
  ])

  return (
    <InstructorSettingsContent
      dictionary={dictionary}
      lang={lang}
      roster={roster}
    />
  )
}
