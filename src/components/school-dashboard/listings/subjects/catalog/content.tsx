// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { PageTitle } from "@/components/atom/page-title"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getText } from "@/components/translation/display"
import type { Lang } from "@/components/translation/types"

import { filterPinnedSubjectIds, getApprovedSubjectProposals } from "./queries"
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

  // Fetch all four independent queries in parallel
  const [catalogSubjects, selections, grades, approvedProposals] =
    await Promise.all([
      // Intentionally global — catalog Subject has no schoolId; schools browse
      // the shared PUBLISHED catalog and bridge via SubjectSelection.
      db.subject.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          department: true,
          levels: true,
          color: true,
          thumbnail: true,
          curriculum: true,
          grades: true,
          lang: true,
        },
      }),
      db.subjectSelection.findMany({
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
      }),
      db.academicGrade.findMany({
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
      }),
      getApprovedSubjectProposals(schoolId),
    ])

  // Build selected subject IDs set (subjects selected for any grade)
  const selectedSubjectIds = new Set(selections.map((s) => s.catalogSubjectId))

  // Approved-but-not-yet-added requested subjects — pinned on top of the picker
  const pinnedSubjectIds = filterPinnedSubjectIds(
    approvedProposals,
    selectedSubjectIds
  )

  // Derive distinct curricula
  const curricula = [...new Set(catalogSubjects.map((s) => s.curriculum))]

  // Translate catalog subjects
  const translatedSubjects = await Promise.all(
    catalogSubjects.map(async ({ lang: contentLang, ...s }) => ({
      id: s.id,
      name: await getText(
        s.name,
        (contentLang || "ar") as Lang,
        lang,
        schoolId
      ),
      slug: s.slug,
      department: s.department
        ? await getText(
            s.department,
            (contentLang || "ar") as Lang,
            lang,
            schoolId
          )
        : s.department,
      levels: s.levels as string[],
      color: s.color,
      curriculum: s.curriculum,
      grades: s.grades as number[],
      imageUrl: getCatalogImageUrl(s.thumbnail, "sm"),
      isSelected: selectedSubjectIds.has(s.id),
    }))
  )

  // Translate academic grades
  const translatedGrades = await Promise.all(
    grades.map(async (g) => ({
      id: g.id,
      name: await getText(g.name, (g.lang || "ar") as Lang, lang, schoolId),
      gradeNumber: g.gradeNumber,
      levelName: g.level?.name
        ? await getText(
            g.level.name,
            (g.level.lang || "ar") as Lang,
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
        pinnedSubjectIds={pinnedSubjectIds}
        schoolId={schoolId}
      />
    </>
  )
}
