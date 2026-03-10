// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { PageTitle } from "@/components/atom/page-title"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { SupportedLanguage } from "@/components/translation/types"

import { SubjectPicker } from "./subject-picker"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export async function CatalogSelectionContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No school context found.
      </p>
    )
  }

  // Fetch all published catalog subjects
  const catalogSubjects = await db.catalogSubject.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      department: true,
      levels: true,
      color: true,
      imageKey: true,
      thumbnailKey: true,
      curriculum: true,
      grades: true,
      lang: true,
    },
  })

  // Fetch school's existing selections
  const selections = await db.schoolSubjectSelection.findMany({
    where: { schoolId },
    select: {
      id: true,
      catalogSubjectId: true,
      gradeId: true,
      streamId: true,
      isRequired: true,
      weeklyPeriods: true,
      customName: true,
      isActive: true,
    },
  })

  // Fetch school's academic grades
  const grades = await db.academicGrade.findMany({
    where: { schoolId },
    orderBy: { gradeNumber: "asc" },
    select: {
      id: true,
      name: true,
      lang: true,
      gradeNumber: true,
      level: {
        select: {
          level: true,
          name: true,
          lang: true,
        },
      },
    },
  })

  // Build selected subject IDs set (subjects selected for any grade)
  const selectedSubjectIds = new Set(selections.map((s) => s.catalogSubjectId))

  // Derive distinct curricula
  const curricula = [...new Set(catalogSubjects.map((s) => s.curriculum))]

  // Translate catalog subjects
  const translatedSubjects = await Promise.all(
    catalogSubjects.map(async ({ lang: contentLang, ...s }) => ({
      id: s.id,
      name: await getDisplayText(
        s.name,
        (contentLang || "ar") as SupportedLanguage,
        lang,
        schoolId
      ),
      slug: s.slug,
      department: s.department
        ? await getDisplayText(
            s.department,
            (contentLang || "ar") as SupportedLanguage,
            lang,
            schoolId
          )
        : s.department,
      levels: s.levels as string[],
      color: s.color,
      curriculum: s.curriculum,
      grades: s.grades as number[],
      imageUrl: getCatalogImageUrl(s.thumbnailKey, s.imageKey, "sm"),
      isSelected: selectedSubjectIds.has(s.id),
    }))
  )

  // Translate academic grades
  const translatedGrades = await Promise.all(
    grades.map(async (g) => ({
      id: g.id,
      name: await getDisplayText(
        g.name,
        (g.lang || "ar") as SupportedLanguage,
        lang,
        schoolId
      ),
      gradeNumber: g.gradeNumber,
      levelName: g.level?.name
        ? await getDisplayText(
            g.level.name,
            (g.level.lang || "ar") as SupportedLanguage,
            lang,
            schoolId
          )
        : "",
      level: (g.level?.level as string) ?? "",
    }))
  )

  // Derive school levels from academic grades
  const schoolLevels = Array.from(
    new Set(
      grades
        .map((g) => g.level?.level as string | undefined)
        .filter((l): l is string => Boolean(l))
    )
  )

  return (
    <>
      <PageTitle title="Catalog" />
      <SubjectPicker
        subjects={translatedSubjects}
        grades={translatedGrades}
        selections={selections}
        schoolLevels={schoolLevels}
        curricula={curricula}
        lang={lang}
      />
    </>
  )
}
