"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { localize } from "@/components/translation/localize"

import type { QuizItem, QuizQuestionStats, QuizSubjectFilter } from "./types"

const QUIZ_EXAM_TYPES = ["quiz", "diagnostic"]

export async function getQuizzes(filters?: {
  catalogSubjectId?: string
  examType?: string
  enrolledSubjectIds?: string[]
}): Promise<QuizItem[]> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    examType: { in: QUIZ_EXAM_TYPES },
  }

  if (filters?.catalogSubjectId) {
    where.subjectId = filters.catalogSubjectId
  } else if (filters?.enrolledSubjectIds) {
    where.subjectId = { in: filters.enrolledSubjectIds }
  }

  if (filters?.examType && QUIZ_EXAM_TYPES.includes(filters.examType)) {
    where.examType = filters.examType
  }

  const [rawExams, { schoolId }] = await Promise.all([
    db.exam.findMany({
      where,
      include: {
        subject: { select: { name: true, slug: true, color: true } },
        chapter: { select: { name: true } },
        lesson: { select: { name: true } },
      },
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    }),
    getTenantContext(),
  ])

  const exams = schoolId
    ? await localize("Exam", rawExams, { schoolId })
    : rawExams

  return exams.map((e) => ({
    id: e.id,
    title: e.title,
    examType: e.examType,
    durationMinutes: e.durationMinutes,
    totalMarks: e.totalMarks,
    totalQuestions: e.totalQuestions,
    usageCount: e.usageCount,
    name: e.subject.name,
    subjectSlug: e.subject.slug,
    subjectColor: e.subject.color,
    chapterName: e.chapter?.name ?? null,
    lessonName: e.lesson?.name ?? null,
  }))
}

export async function getQuizQuestionStats(
  catalogSubjectId?: string,
  enrolledSubjectIds?: string[]
): Promise<QuizQuestionStats[]> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED" as const,
    approvalStatus: "APPROVED" as const,
  }

  if (catalogSubjectId) {
    where.catalogSubjectId = catalogSubjectId
  } else if (enrolledSubjectIds) {
    where.catalogSubjectId = { in: enrolledSubjectIds }
  }

  const questions = await db.question.findMany({
    where,
    select: {
      catalogSubjectId: true,
      catalogSubject: { select: { name: true } },
      difficulty: true,
      questionType: true,
    },
  })

  const statsMap = new Map<string, QuizQuestionStats>()

  for (const q of questions) {
    if (!q.catalogSubjectId) continue

    let stats = statsMap.get(q.catalogSubjectId)
    if (!stats) {
      stats = {
        catalogSubjectId: q.catalogSubjectId,
        name: q.catalogSubject?.name ?? "Unknown",
        totalQuestions: 0,
        byDifficulty: {},
        byType: {},
      }
      statsMap.set(q.catalogSubjectId, stats)
    }

    stats.totalQuestions++
    stats.byDifficulty[q.difficulty] =
      (stats.byDifficulty[q.difficulty] ?? 0) + 1
    stats.byType[q.questionType] = (stats.byType[q.questionType] ?? 0) + 1
  }

  return Array.from(statsMap.values()).sort(
    (a, b) => b.totalQuestions - a.totalQuestions
  )
}

export async function getSubjectsForQuizFilter(
  enrolledSubjectIds?: string[]
): Promise<QuizSubjectFilter[]> {
  const subjects = await db.subject.findMany({
    where: {
      ...(enrolledSubjectIds ? { id: { in: enrolledSubjectIds } } : {}),
      exams: {
        some: {
          status: "PUBLISHED",
          examType: { in: QUIZ_EXAM_TYPES },
        },
      },
    },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })

  return subjects
}
