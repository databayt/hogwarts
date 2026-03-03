"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Shared server action to fetch student attempt history
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { AttemptItem } from "./attempt-history"

/**
 * Get attempt history for the current student.
 * For guardians, pass childStudentId to get a specific child's history.
 * Optionally filter by exam type (mock exams, quizzes, etc.)
 */
export async function getStudentAttempts(options?: {
  childStudentId?: string
  examTypes?: string[]
}): Promise<AttemptItem[]> {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const role = session?.user?.role

  if (!schoolId) return []

  let studentIds: string[] = []

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId: session?.user?.id, schoolId },
      select: { id: true },
    })
    if (student) studentIds = [student.id]
  } else if (role === "GUARDIAN") {
    if (options?.childStudentId) {
      studentIds = [options.childStudentId]
    } else {
      const guardian = await db.guardian.findFirst({
        where: { userId: session?.user?.id, schoolId },
        select: { id: true },
      })
      if (guardian) {
        const sgs = await db.studentGuardian.findMany({
          where: { guardianId: guardian.id, schoolId },
          select: { studentId: true },
        })
        studentIds = sgs.map((sg) => sg.studentId)
      }
    }
  }

  if (studentIds.length === 0) return []

  // Fetch exam results for these students
  const results = await db.examResult.findMany({
    where: {
      schoolId,
      studentId: { in: studentIds },
      isAbsent: false,
    },
    select: {
      id: true,
      examId: true,
      studentId: true,
      marksObtained: true,
      totalMarks: true,
      percentage: true,
      grade: true,
      createdAt: true,
      exam: {
        select: {
          id: true,
          title: true,
          subject: { select: { subjectName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Also fetch sessions for attempt number data
  const sessions = await db.examSession.findMany({
    where: {
      schoolId,
      studentId: { in: studentIds },
      status: "SUBMITTED",
    },
    select: {
      examId: true,
      studentId: true,
      attemptNumber: true,
      startedAt: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: "desc" },
  })

  // Build session lookup by examId+studentId
  const sessionMap = new Map<
    string,
    { attemptNumber: number; startedAt: Date | null; submittedAt: Date | null }
  >()
  for (const s of sessions) {
    const key = `${s.examId}-${s.studentId}`
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        attemptNumber: s.attemptNumber,
        startedAt: s.startedAt,
        submittedAt: s.submittedAt,
      })
    }
  }

  // Find the best score per exam
  const bestByExam = new Map<string, number>()
  for (const r of results) {
    const current = bestByExam.get(r.examId) ?? -1
    if (r.percentage > current) bestByExam.set(r.examId, r.percentage)
  }

  return results.map((r) => {
    const sessionKey = `${r.examId}-${r.studentId}`
    const session = sessionMap.get(sessionKey)

    return {
      id: r.id,
      examTitle: r.exam.title || "Exam",
      subjectName: r.exam.subject?.subjectName || null,
      attemptNumber: session?.attemptNumber ?? 1,
      score: r.marksObtained,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
      grade: r.grade,
      startedAt: session?.startedAt?.toISOString() || null,
      submittedAt:
        session?.submittedAt?.toISOString() || r.createdAt.toISOString(),
      isBest: r.percentage === bestByExam.get(r.examId),
    }
  })
}
