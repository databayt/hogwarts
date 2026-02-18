import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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
      totalChapters: true,
      totalLessons: true,
      usageCount: true,
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
      gradeNumber: true,
      level: {
        select: {
          level: true,
          name: true,
        },
      },
    },
  })

  // Build selected subject IDs set (subjects selected for any grade)
  const selectedSubjectIds = new Set(selections.map((s) => s.catalogSubjectId))

  return (
    <SubjectPicker
      subjects={catalogSubjects.map((s) => ({
        ...s,
        levels: s.levels as string[],
        isSelected: selectedSubjectIds.has(s.id),
      }))}
      grades={grades.map((g) => ({
        id: g.id,
        name: g.name,
        gradeNumber: g.gradeNumber,
        levelName: g.level?.name ?? "",
        level: (g.level?.level as string) ?? "",
      }))}
      selections={selections}
      lang={lang}
    />
  )
}
