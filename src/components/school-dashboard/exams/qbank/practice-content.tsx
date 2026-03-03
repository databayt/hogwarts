// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"

import { PracticeSession } from "./practice-session"

interface Props {
  lang: Locale
}

export default async function PracticeContent({ lang }: Props) {
  const { schoolId } = await getTenantContext()
  const session = await auth()

  if (!schoolId || !session?.user?.id) return null

  // Get student's enrolled subjects
  const student = await db.student.findFirst({
    where: { userId: session.user.id, schoolId },
    select: { id: true },
  })

  if (!student) return null

  const enrolledClasses = await db.studentClass.findMany({
    where: { studentId: student.id, schoolId },
    include: {
      class: {
        select: {
          subjectId: true,
          subject: { select: { id: true, subjectName: true } },
        },
      },
    },
  })

  const subjectIds = [
    ...new Set(
      enrolledClasses
        .map((sc) => sc.class.subjectId)
        .filter(Boolean) as string[]
    ),
  ]

  if (subjectIds.length === 0) return null

  // Fetch questions grouped by subject with counts by difficulty and type
  const [questions, subjects] = await Promise.all([
    db.questionBank.findMany({
      where: { schoolId, subjectId: { in: subjectIds } },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        difficulty: true,
        bloomLevel: true,
        points: true,
        options: true,
        subjectId: true,
      },
    }),
    db.subject.findMany({
      where: { schoolId, id: { in: subjectIds } },
      select: { id: true, subjectName: true },
    }),
  ])

  // Build subject summary cards
  const subjectSummaries = subjects.map((sub) => {
    const subQuestions = questions.filter((q) => q.subjectId === sub.id)
    const easyCount = subQuestions.filter((q) => q.difficulty === "EASY").length
    const mediumCount = subQuestions.filter(
      (q) => q.difficulty === "MEDIUM"
    ).length
    const hardCount = subQuestions.filter((q) => q.difficulty === "HARD").length

    return {
      id: sub.id,
      name: sub.subjectName || sub.id,
      totalQuestions: subQuestions.length,
      easyCount,
      mediumCount,
      hardCount,
    }
  })

  // Serialize questions for the client component
  const serializedQuestions = questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    difficulty: q.difficulty,
    bloomLevel: q.bloomLevel,
    points: Number(q.points),
    options: q.options as Record<string, unknown> | null,
    subjectId: q.subjectId || "",
  }))

  return (
    <PracticeSession
      subjects={subjectSummaries}
      questions={serializedQuestions}
      lang={lang}
    />
  )
}
