"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { localize } from "@/components/translation/localize"

import {
  buildQuestionWhere,
  buildQuizWhere,
  pageArgs,
  QUIZ_EXAM_TYPES,
  QUIZ_PAGE_SIZE,
  type QuizFilters,
} from "./query"
import type {
  QuizPage,
  QuizQuestionStats,
  QuizSubjectFilter,
  QuizSummary,
} from "./types"

/** One page of quizzes (never the whole catalog) plus the total for the pager. */
export async function getQuizzes(filters?: QuizFilters): Promise<QuizPage> {
  const where = buildQuizWhere(filters)
  const pageSize = filters?.pageSize ?? QUIZ_PAGE_SIZE
  const { page, take, skip } = pageArgs(filters?.page, pageSize)

  const [rawExams, total, { schoolId }] = await Promise.all([
    db.exam.findMany({
      where,
      // Only what the cards render: no questions / description / JSON columns.
      select: {
        id: true,
        title: true,
        lang: true,
        examType: true,
        durationMinutes: true,
        totalMarks: true,
        totalQuestions: true,
        usageCount: true,
        subject: { select: { name: true, slug: true, color: true } },
        chapter: { select: { name: true } },
        lesson: { select: { name: true } },
      },
      // id last: a stable order, so pages never overlap or skip rows
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      take,
      skip,
    }),
    db.exam.count({ where }),
    getTenantContext(),
  ])

  const exams = schoolId
    ? await localize("Exam", rawExams, { schoolId })
    : rawExams

  return {
    items: exams.map((e) => ({
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
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  }
}

/** Headline numbers over the whole filtered set, by aggregate. */
export async function getQuizSummary(
  filters?: QuizFilters
): Promise<QuizSummary> {
  const agg = await db.exam.aggregate({
    where: buildQuizWhere(filters),
    _count: { _all: true },
    _avg: { totalQuestions: true },
  })
  return {
    totalQuizzes: agg._count._all,
    avgQuestions: Math.round(agg._avg.totalQuestions ?? 0),
  }
}

/** Question-bank breakdown per subject — groupBy, never the rows. */
export async function getQuizQuestionStats(
  catalogSubjectId?: string,
  enrolledSubjectIds?: string[]
): Promise<QuizQuestionStats[]> {
  const where = buildQuestionWhere(catalogSubjectId, enrolledSubjectIds)

  const groups = await db.question.groupBy({
    by: ["catalogSubjectId", "difficulty", "questionType"],
    where,
    _count: { _all: true },
  })

  const ids = [
    ...new Set(
      groups.map((g) => g.catalogSubjectId).filter((id): id is string => !!id)
    ),
  ]
  const names = ids.length
    ? await db.subject.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    : []
  const nameById = new Map(names.map((s) => [s.id, s.name]))

  const statsMap = new Map<string, QuizQuestionStats>()
  for (const g of groups) {
    if (!g.catalogSubjectId) continue
    const count = g._count._all
    let stats = statsMap.get(g.catalogSubjectId)
    if (!stats) {
      stats = {
        catalogSubjectId: g.catalogSubjectId,
        name: nameById.get(g.catalogSubjectId) ?? "Unknown",
        totalQuestions: 0,
        byDifficulty: {},
        byType: {},
      }
      statsMap.set(g.catalogSubjectId, stats)
    }
    stats.totalQuestions += count
    stats.byDifficulty[g.difficulty] =
      (stats.byDifficulty[g.difficulty] ?? 0) + count
    stats.byType[g.questionType] = (stats.byType[g.questionType] ?? 0) + count
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
