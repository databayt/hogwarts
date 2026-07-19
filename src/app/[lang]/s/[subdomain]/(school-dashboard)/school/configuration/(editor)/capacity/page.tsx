// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CapacityForm } from "@/components/onboarding/capacity/form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.capacity?.title ||
      "Configuration: Capacity",
  }
}

export default async function CapacityPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: {
            schoolLevel: true,
            maxStudents: true,
            maxTeachers: true,
          },
        })
        .catch(() => null)
    : null

  return (
    <CapacityForm
      schoolId={schoolId || ""}
      schoolLevel={school?.schoolLevel || "both"}
      initialData={{
        teachers: school?.maxTeachers || 10,
        sectionsPerGrade: 2,
        studentsPerSection: 30,
      }}
      dictionary={dictionary}
    />
  )
}
