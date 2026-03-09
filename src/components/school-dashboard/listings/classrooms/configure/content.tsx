// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

import { getGradeConfiguration } from "./actions"
import { ConfigureForm } from "./form"

interface Props {
  dictionary: any
  lang: Locale
}

async function getSchoolDefaults() {
  try {
    const session = await auth()
    if (!session?.user) return undefined

    const { schoolId } = await getTenantContext()
    if (!schoolId) return undefined

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { sectionsPerGrade: true, studentsPerSection: true },
    })

    if (!school) return undefined

    return {
      sectionsPerGrade: school.sectionsPerGrade ?? 2,
      studentsPerSection: school.studentsPerSection ?? 30,
    }
  } catch {
    return undefined
  }
}

async function getActiveTerms() {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return []

    const terms = await db.term.findMany({
      where: { schoolId, isActive: true },
      select: {
        id: true,
        termNumber: true,
        schoolYear: { select: { yearName: true } },
      },
      orderBy: { startDate: "desc" },
    })

    return terms.map((t) => ({
      id: t.id,
      label: `${t.schoolYear.yearName} - Term ${t.termNumber}`,
    }))
  } catch {
    return []
  }
}

export async function ConfigureContent({ dictionary, lang }: Props) {
  const d = dictionary?.classrooms?.configure

  const [result, schoolDefaults, activeTerms] = await Promise.all([
    getGradeConfiguration(),
    getSchoolDefaults(),
    getActiveTerms(),
  ])

  if (!result.success) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">
          {result.error}
        </CardContent>
      </Card>
    )
  }

  if (!result.data) {
    return null
  }
  const { grades, roomTypes } = result.data

  if (roomTypes.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">
          {d?.setupTypes ||
            'Please set up classroom types first (e.g., "Classroom", "Lab") in the Rooms tab.'}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{d?.title || "Sections per Grade"}</CardTitle>
        <CardDescription>
          {d?.description ||
            "Configure how many sections each grade should have. Generating sections automatically creates both the class section and its assigned room. Generated sections use placeholder teacher and subject assignments — reassign them in the Classes view after generation."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfigureForm
          grades={grades}
          roomTypes={roomTypes}
          schoolDefaults={schoolDefaults}
          activeTerms={activeTerms}
        />
      </CardContent>
    </Card>
  )
}
