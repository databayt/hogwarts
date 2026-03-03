// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TemplateWizardClient } from "@/components/school-dashboard/exams/wizard/template-wizard/client"

export const metadata = { title: "Edit Template" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; configId: string }>
}

export default async function EditTemplateWizardPage({ params }: Props) {
  const { lang, configId } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  if (!schoolId) return null

  const [existingTemplate, subjects, grades] = await Promise.all([
    db.examTemplate.findUnique({
      where: { id: configId, schoolId },
      include: { subject: { select: { id: true, subjectName: true } } },
    }),
    db.subject.findMany({
      where: { schoolId },
      select: { id: true, subjectName: true },
      orderBy: { subjectName: "asc" },
    }),
    db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true, gradeNumber: true },
      orderBy: { gradeNumber: "asc" },
    }),
  ])

  if (!existingTemplate) {
    return notFound()
  }

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
      existingTemplate={{
        id: existingTemplate.id,
        name: existingTemplate.name,
        description: existingTemplate.description,
        subjectId: existingTemplate.subjectId,
        duration: existingTemplate.duration,
        totalMarks: Number(existingTemplate.totalMarks),
        distribution: existingTemplate.distribution as Record<
          string,
          Record<string, number>
        >,
        bloomDistribution: existingTemplate.bloomDistribution as Record<
          string,
          number
        > | null,
      }}
    />
  )
}
