"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

import type { QuizItem, QuizQuestionStats, QuizSubjectFilter } from "./types"

const QUIZ_EXAM_TYPES = ["quiz", "diagnostic"]

export async function getQuizzes(filters?: {
  catalogSubjectId?: string
  examType?: string
}): Promise<QuizItem[]> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    examType: { in: QUIZ_EXAM_TYPES },
  }

  if (filters?.catalogSubjectId) {
    where.subjectId = filters.catalogSubjectId
  }

  if (filters?.examType && QUIZ_EXAM_TYPES.includes(filters.examType)) {
    where.examType = filters.examType
  }

  const exams = await db.catalogExam.findMany({
    where,
    include: {
      subject: { select: { name: true, slug: true, color: true } },
      chapter: { select: { name: true } },
      lesson: { select: { name: true } },
    },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
  })

  return exams.map((e) => ({
    id: e.id,
    title: e.title,
    examType: e.examType,
    durationMinutes: e.durationMinutes,
    totalMarks: e.totalMarks,
    totalQuestions: e.totalQuestions,
    usageCount: e.usageCount,
    subjectName: e.subject.name,
    subjectSlug: e.subject.slug,
    subjectColor: e.subject.color,
    chapterName: e.chapter?.name ?? null,
    lessonName: e.lesson?.name ?? null,
  }))
}

export async function getQuizQuestionStats(
  catalogSubjectId?: string
): Promise<QuizQuestionStats[]> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED" as const,
    approvalStatus: "APPROVED" as const,
  }

  if (catalogSubjectId) {
    where.catalogSubjectId = catalogSubjectId
  }

  const questions = await db.catalogQuestion.findMany({
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
        subjectName: q.catalogSubject?.name ?? "Unknown",
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

export async function getCatalogSubjectsForQuizFilter(): Promise<
  QuizSubjectFilter[]
> {
  const subjects = await db.catalogSubject.findMany({
    where: {
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
