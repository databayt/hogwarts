"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

import type { MockExamItem, MockSubjectFilter } from "./types"

const MOCK_EXAM_TYPES = ["final", "midterm", "chapter_test", "practice"]

export async function getMockExams(filters?: {
  catalogSubjectId?: string
  examType?: string
}): Promise<MockExamItem[]> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    examType: { in: MOCK_EXAM_TYPES },
  }

  if (filters?.catalogSubjectId) {
    where.subjectId = filters.catalogSubjectId
  }

  if (filters?.examType && MOCK_EXAM_TYPES.includes(filters.examType)) {
    where.examType = filters.examType
  }

  const exams = await db.catalogExam.findMany({
    where,
    include: {
      subject: { select: { name: true, slug: true, color: true } },
      chapter: { select: { name: true } },
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
  }))
}

export async function getCatalogSubjectsForMockFilter(): Promise<
  MockSubjectFilter[]
> {
  const subjects = await db.catalogSubject.findMany({
    where: {
      exams: {
        some: {
          status: "PUBLISHED",
          examType: { in: MOCK_EXAM_TYPES },
        },
      },
    },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })

  return subjects
}
