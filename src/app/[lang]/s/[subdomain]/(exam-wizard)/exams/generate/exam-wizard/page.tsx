// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { ExamWizardClient } from "@/components/school-dashboard/exams/wizard/exam-wizard/client"
import type {
  ClassOption,
  ExamOption,
  QuestionOption,
  TemplateOption,
} from "@/components/school-dashboard/exams/wizard/exam-wizard/types"

export const metadata = { title: "Exam Wizard" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ExamWizardPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) return null

  // Fetch all data in parallel
  const [rawTemplates, rawExams, rawClasses, rawQuestions] = await Promise.all([
    db.examTemplate.findMany({
      where: { schoolId, isActive: true },
      orderBy: { updatedAt: "desc" },
      include: {
        subject: { select: { id: true, subjectName: true } },
      },
    }),
    db.exam.findMany({
      where: { schoolId, status: "PLANNED" },
      orderBy: { examDate: "asc" },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, subjectName: true } },
      },
    }),
    db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        subjectId: true,
        subject: { select: { subjectName: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.questionBank.findMany({
      where: { schoolId },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        difficulty: true,
        bloomLevel: true,
        points: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Transform to client-safe types
  const templates: TemplateOption[] = rawTemplates.map((t) => {
    const distribution = t.distribution as Record<
      string,
      Record<string, number>
    >
    const totalQuestions = Object.values(distribution).reduce(
      (sum, diffs) => sum + Object.values(diffs).reduce((a, b) => a + b, 0),
      0
    )
    return {
      id: t.id,
      name: t.name,
      subjectName: t.subject?.subjectName || t.subjectId,
      subjectId: t.subjectId,
      duration: t.duration,
      totalMarks: Number(t.totalMarks),
      totalQuestions,
      distribution,
    }
  })

  const existingExams: ExamOption[] = rawExams.map((e) => ({
    id: e.id,
    title: e.title,
    className: e.class?.name || "",
    subjectName: e.subject?.subjectName || "",
    examDate: e.examDate.toISOString(),
    status: e.status,
  }))

  const classes: ClassOption[] = rawClasses.map((c) => ({
    id: c.id,
    name: c.name || c.id,
    subjectId: c.subjectId,
    subjectName: c.subject?.subjectName || "",
  }))

  const questions: QuestionOption[] = rawQuestions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    difficulty: q.difficulty,
    bloomLevel: q.bloomLevel,
    points: Number(q.points),
    selected: false,
  }))

  return (
    <ExamWizardClient
      lang={lang}
      templates={templates}
      existingExams={existingExams}
      classes={classes}
      questions={questions}
    />
  )
}
