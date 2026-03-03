// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TemplateWizardClient } from "@/components/school-dashboard/exams/wizard/template-wizard/client"

export const metadata = { title: "Template Wizard" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TemplateWizardPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  if (!schoolId) return null

  // Fetch subjects for this school
  const subjects = await db.subject.findMany({
    where: { schoolId },
    select: { id: true, subjectName: true },
    orderBy: { subjectName: "asc" },
  })

  // Fetch grades for this school
  const grades = await db.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, name: true, gradeNumber: true },
    orderBy: { gradeNumber: "asc" },
  })

  return (
    <TemplateWizardClient
      lang={lang}
      dictionary={dictionary}
      schoolId={schoolId}
      subjects={subjects.map((s) => ({
        id: s.id,
        name: s.subjectName || s.id,
      }))}
      grades={grades.map((g) => ({
        id: g.id,
        name: g.name || `Grade ${g.gradeNumber}`,
      }))}
    />
  )
}
