// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { getLabels } from "@/components/translation/person"

import type { SubjectRow } from "./columns"
import { CatalogTable } from "./table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function CatalogContent({ lang }: Props) {
  const subjects = await db.subject.findMany({
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
      lang: true,
    },
  })

  const totalChapters = subjects.reduce((s, sub) => s + sub.totalChapters, 0)
  const totalLessons = subjects.reduce((s, sub) => s + sub.totalLessons, 0)

  // One batched, deduped resolution for all names/departments (global scope)
  const labels = await getLabels(
    subjects.flatMap((s) => [s.name, s.department]),
    lang,
    "global"
  )
  const rows: SubjectRow[] = subjects.map(({ lang: _contentLang, ...s }) => ({
    ...s,
    name: labels.get(s.name) ?? s.name,
    department: s.department
      ? (labels.get(s.department) ?? s.department)
      : s.department,
    levels: s.levels as string[],
    grades: s.grades,
  }))

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
