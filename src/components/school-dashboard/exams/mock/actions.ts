"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import type { MockExamItem, MockSubjectFilter, SchoolMockItem } from "./types"

const MOCK_EXAM_TYPES = ["final", "midterm", "chapter_test", "practice"]

export async function getMockExams(filters?: {
  catalogSubjectId?: string
  examType?: string
  enrolledCatalogSubjectIds?: string[]
}): Promise<MockExamItem[]> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    examType: { in: MOCK_EXAM_TYPES },
  }

  if (filters?.catalogSubjectId) {
    where.subjectId = filters.catalogSubjectId
  } else if (filters?.enrolledCatalogSubjectIds) {
    where.subjectId = { in: filters.enrolledCatalogSubjectIds }
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

export async function getCatalogSubjectsForMockFilter(
  enrolledCatalogSubjectIds?: string[]
): Promise<MockSubjectFilter[]> {
  const subjects = await db.catalogSubject.findMany({
    where: {
      ...(enrolledCatalogSubjectIds
        ? { id: { in: enrolledCatalogSubjectIds } }
        : {}),
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

export async function getSchoolMockExams(
  schoolId: string,
  enrolledSubjectIds?: string[]
): Promise<SchoolMockItem[]> {
  const generatedExams = await db.generatedExam.findMany({
    where: {
      schoolId,
      isMockEligible: true,
      ...(enrolledSubjectIds
        ? { exam: { subjectId: { in: enrolledSubjectIds } } }
        : {}),
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          subject: { select: { subjectName: true } },
          class: { select: { name: true } },
        },
      },
      template: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return generatedExams.map((ge) => ({
    id: ge.id,
    examId: ge.examId,
    title: ge.exam.title,
    totalQuestions: ge.totalQuestions,
    subjectName: ge.exam.subject?.subjectName || "",
    className: ge.exam.class?.name || "",
    templateName: ge.template?.name || null,
    createdAt: ge.createdAt.toISOString(),
  }))
}

export async function toggleMockEligibility(
  generatedExamId: string,
  schoolId: string
): Promise<ActionResponse> {
  try {
    const ge = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId },
      select: { isMockEligible: true },
    })
    if (!ge) return { success: false, error: "Not found" }

    await db.generatedExam.update({
      where: { id: generatedExamId },
      data: { isMockEligible: !ge.isMockEligible },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle",
    }
  }
}
