// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { ScheduleGrid } from "./schedule-grid"

interface Props {
  lang: Locale
}

export default async function RoomScheduleOverview({ lang }: Props) {
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.classrooms

  if (!schoolId) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        {d?.missingSchool || "Missing school context"}
      </div>
    )
  }

  const { term } = await resolveActiveTerm(schoolId)

  if (!term) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        {d?.noActiveTerm || "No active term found. Schedule data unavailable."}
      </div>
    )
  }

  // Query timetable slots to find classes that actually have schedule data
  const timetableSlots = await db.timetable.findMany({
    where: { schoolId, termId: term.id },
    select: {
      class: {
        select: {
          id: true,
          name: true,
          gradeId: true,
          grade: {
            select: { id: true, name: true, gradeNumber: true },
          },
        },
      },
    },
    distinct: ["classId"],
  })

  // Group classes by grade
  const gradeMap = new Map<
    string,
    {
      id: string
      name: string
      gradeNumber: number
      sections: { id: string; name: string }[]
    }
  >()

  for (const slot of timetableSlots) {
    const cls = slot.class
    if (!cls.gradeId || !cls.grade) continue

    const grade = cls.grade
    if (!gradeMap.has(grade.id)) {
      gradeMap.set(grade.id, {
        id: grade.id,
        name: grade.name,
        gradeNumber: grade.gradeNumber,
        sections: [],
      })
    }
    gradeMap.get(grade.id)!.sections.push({ id: cls.id, name: cls.name })
  }

  const gradesWithClasses = [...gradeMap.values()]
    .sort((a, b) => a.gradeNumber - b.gradeNumber)
    .map((g) => ({
      ...g,
      sections: g.sections.sort((a, b) => a.name.localeCompare(b.name)),
    }))

  // Fallback: classes exist in timetable but have no gradeId
  if (gradesWithClasses.length === 0) {
    const ungradedClasses = timetableSlots.map((s) => ({
      id: s.class.id,
      name: s.class.name,
    }))

    if (ungradedClasses.length > 0) {
      gradesWithClasses.push({
        id: "ungraded",
        name: "All Classes",
        gradeNumber: 0,
        sections: ungradedClasses.sort((a, b) => a.name.localeCompare(b.name)),
      })
    }
  }

  if (gradesWithClasses.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        {d?.noGradesScheduled ||
          "No grades with scheduled classes found for the active term."}
      </div>
    )
  }

  return (
    <ScheduleGrid
      lang={lang}
      termId={term.id}
      grades={gradesWithClasses.map((g) => ({
        id: g.id,
        name: g.name,
        gradeNumber: g.gradeNumber,
        sections: g.sections,
      }))}
    />
  )
}
