"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { localize } from "@/components/translation/localize"

import type { MockExamItem, MockSubjectFilter, SchoolMockItem } from "./types"

const MOCK_EXAM_TYPES = ["final", "midterm", "chapter_test", "practice"]

export async function getMockExams(filters?: {
  catalogSubjectId?: string
  examType?: string
  enrolledSubjectIds?: string[]
}): Promise<MockExamItem[]> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    examType: { in: MOCK_EXAM_TYPES },
  }

  if (filters?.catalogSubjectId) {
    where.subjectId = filters.catalogSubjectId
  } else if (filters?.enrolledSubjectIds) {
    where.subjectId = { in: filters.enrolledSubjectIds }
  }

  if (filters?.examType && MOCK_EXAM_TYPES.includes(filters.examType)) {
    where.examType = filters.examType
  }

  const [rawExams, { schoolId }] = await Promise.all([
    db.exam.findMany({
      where,
      include: {
        subject: { select: { name: true, slug: true, color: true } },
        chapter: { select: { name: true } },
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
  }))
}

export async function getSubjectsForMockFilter(
  enrolledSubjectIds?: string[]
): Promise<MockSubjectFilter[]> {
  const subjects = await db.subject.findMany({
    where: {
      ...(enrolledSubjectIds ? { id: { in: enrolledSubjectIds } } : {}),
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
          subject: { select: { name: true } },
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
    name: ge.exam.subject?.name || "",
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
    if (!ge) return actionError(ACTION_ERRORS.NOT_FOUND)

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
