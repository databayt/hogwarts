// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import type { SupportedLanguage } from "@/components/translation/types"

import type { CatalogSubjectRow } from "./columns"
import { CatalogTable } from "./table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function CatalogContent({ lang }: Props) {
  const subjects = await db.catalogSubject.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      department: true,
      levels: true,
      grades: true,
      status: true,
      totalChapters: true,
      totalLessons: true,
      usageCount: true,
      color: true,
      imageKey: true,
      lang: true,
    },
  })

  const totalChapters = subjects.reduce((s, sub) => s + sub.totalChapters, 0)
  const totalLessons = subjects.reduce((s, sub) => s + sub.totalLessons, 0)

  const rows: CatalogSubjectRow[] = await Promise.all(
    subjects.map(async ({ lang: contentLang, ...s }) => ({
      ...s,
      name: await getDisplayText(
        s.name,
        (contentLang || "ar") as SupportedLanguage,
        lang,
        "global"
      ),
      department: s.department
        ? await getDisplayText(
            s.department,
            (contentLang || "ar") as SupportedLanguage,
            lang,
            "global"
          )
        : s.department,
      levels: s.levels as string[],
      grades: s.grades,
    }))
  )

  return (
    <CatalogTable
      data={rows}
      stats={{
        subjects: subjects.length,
        chapters: totalChapters,
        lessons: totalLessons,
      }}
    />
  )
}
