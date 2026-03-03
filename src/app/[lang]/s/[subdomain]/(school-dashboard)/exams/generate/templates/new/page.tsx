// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TemplateWizardClient } from "@/components/school-dashboard/exams/wizard/template-wizard/client"

export const metadata = { title: "Create Template" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewTemplatePage({ params }: Props) {
  const { lang } = await params

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams`)
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    redirect(`/${lang}/exams`)
  }

  const [dictionary, subjectsRaw, gradesRaw, templatesRaw] = await Promise.all([
    getDictionary(lang),
    db.subject.findMany({
      where: { schoolId },
      select: { id: true, subjectName: true },
      orderBy: { subjectName: "asc" },
    }),
    db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.examTemplate.findMany({
      where: { schoolId },
      select: { id: true, name: true, blockConfig: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const subjects = subjectsRaw.map((s) => ({ id: s.id, name: s.subjectName }))
  const grades = gradesRaw.map((g) => ({ id: g.id, name: g.name }))
  const schoolTemplates = templatesRaw.map((t) => ({
    id: t.id,
    name: t.name,
    blockConfig: t.blockConfig,
  }))

  return (
    <TemplateWizardClient
      lang={lang}
      dictionary={dictionary}
      schoolId={schoolId}
      subjects={subjects}
      grades={grades}
      schoolTemplates={schoolTemplates}
    />
  )
}
