// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { getTenantContext } from "@/lib/tenant-context"
import { ModalProvider } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { GradeDetailContent } from "@/components/school-dashboard/listings/grades/detail-content"
import {
  getClassGradeStats,
  getResultDetail,
  getStudentGradeHistory,
  getStudentRank,
} from "@/components/school-dashboard/listings/grades/queries"
import { getLabels } from "@/components/translation/person"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function GradeDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return notFound()
  }

  // Fetch grade detail
  const raw = await getResultDetail(schoolId, id)

  if (!raw) {
    return notFound()
  }

  // Section, subject and item titles are stored in one language; show them
  // in the viewer's, as the gradebook list does (one batched pass).
  const labels = await getLabels(
    [
      raw.section?.name,
      raw.subject?.name,
      raw.assignment?.title,
      raw.exam?.title,
      raw.title,
    ],
    lang,
    schoolId
  )
  const t = (v: string | null | undefined) => (v ? (labels.get(v) ?? v) : v)
  const grade = {
    ...raw,
    title: t(raw.title) ?? null,
    section: raw.section
      ? { ...raw.section, name: t(raw.section.name) ?? raw.section.name }
      : null,
    subject: raw.subject
      ? { ...raw.subject, name: t(raw.subject.name) ?? raw.subject.name }
      : null,
    assignment: raw.assignment
      ? {
          ...raw.assignment,
          title: t(raw.assignment.title) ?? raw.assignment.title,
        }
      : null,
    exam: raw.exam
      ? { ...raw.exam, title: t(raw.exam.title) ?? raw.exam.title }
      : null,
  }

  // Fetch analytics data in parallel. `gradedBy` is a user id — show the
  // teacher's name, never the raw id.
  const [history, classStats, grader, nameDisplay] = await Promise.all([
    getStudentGradeHistory(schoolId, grade.studentId),
    getClassGradeStats(schoolId, {
      sectionId: grade.sectionId,
      subjectId: grade.subjectId,
      assignmentId: grade.assignmentId,
      examId: grade.examId,
    }),
    grade.gradedBy
      ? db.user.findFirst({
          where: { id: grade.gradedBy, schoolId },
          select: {
            username: true,
            teacher: {
              select: { firstName: true, middleName: true, lastName: true },
            },
          },
        })
      : null,
    schoolNameDisplay(schoolId),
  ])
  const gradedByName = grader
    ? grader.teacher
      ? displayName(grader.teacher, nameDisplay)
      : grader.username
    : null

  // Calculate student rank
  const studentRank = getStudentRank(grade.studentId, classStats)

  return (
    <ModalProvider>
      <GradeDetailContent
        grade={grade}
        history={history}
        classStats={classStats}
        studentRank={studentRank}
        gradedByName={gradedByName}
        dictionary={dictionary}
        lang={lang}
      />
    </ModalProvider>
  )
}
