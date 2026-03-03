"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Server action to compute student progress data for the progress dashboard
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface SubjectTrend {
  subjectName: string
  subjectId: string
  dataPoints: { date: string; percentage: number }[]
  average: number
  trend: "up" | "down" | "stable"
}

export interface QuestionTypePerformance {
  type: string
  correct: number
  total: number
  percentage: number
}

export interface BloomPerformance {
  level: string
  correct: number
  total: number
  percentage: number
}

export interface ProgressData {
  subjectTrends: SubjectTrend[]
  questionTypePerformance: QuestionTypePerformance[]
  bloomPerformance: BloomPerformance[]
  overallAverage: number
  totalExams: number
  bestSubject: string | null
  weakestSubject: string | null
}

/**
 * Get progress data for a student.
 * For guardians, pass childStudentId.
 */
export async function getStudentProgress(options?: {
  childStudentId?: string
}): Promise<ProgressData | null> {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const role = session?.user?.role

  if (!schoolId) return null

  let studentId: string | null = null

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId: session?.user?.id, schoolId },
      select: { id: true },
    })
    studentId = student?.id ?? null
  } else if (role === "GUARDIAN") {
    if (options?.childStudentId) {
      studentId = options.childStudentId
    } else {
      // Get first child
      const guardian = await db.guardian.findFirst({
        where: { userId: session?.user?.id, schoolId },
        select: { id: true },
      })
      if (guardian) {
        const sg = await db.studentGuardian.findFirst({
          where: { guardianId: guardian.id, schoolId },
          select: { studentId: true },
        })
        studentId = sg?.studentId ?? null
      }
    }
  }

  if (!studentId) return null

  // Fetch all exam results for this student with subject info
  const results = await db.examResult.findMany({
    where: {
      schoolId,
      studentId,
      isAbsent: false,
    },
    select: {
      id: true,
      examId: true,
      percentage: true,
      marksObtained: true,
      totalMarks: true,
      createdAt: true,
      exam: {
        select: {
          subjectId: true,
          subject: { select: { subjectName: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  if (results.length === 0) {
    return {
      subjectTrends: [],
      questionTypePerformance: [],
      bloomPerformance: [],
      overallAverage: 0,
      totalExams: 0,
      bestSubject: null,
      weakestSubject: null,
    }
  }

  // 1. Subject-wise score trends
  const subjectMap = new Map<
    string,
    { name: string; points: { date: string; percentage: number }[] }
  >()
  for (const r of results) {
    const sid = r.exam.subjectId
    const name = r.exam.subject.subjectName || "Unknown"
    if (!subjectMap.has(sid)) {
      subjectMap.set(sid, { name, points: [] })
    }
    subjectMap.get(sid)!.points.push({
      date: r.createdAt.toISOString().split("T")[0],
      percentage: r.percentage,
    })
  }

  const subjectTrends: SubjectTrend[] = []
  let bestSubject: { name: string; avg: number } | null = null
  let weakestSubject: { name: string; avg: number } | null = null

  for (const [sid, data] of subjectMap) {
    const avg =
      data.points.reduce((s, p) => s + p.percentage, 0) / data.points.length
    const trend =
      data.points.length >= 2
        ? data.points[data.points.length - 1].percentage >
          data.points[0].percentage
          ? "up"
          : data.points[data.points.length - 1].percentage <
              data.points[0].percentage
            ? "down"
            : "stable"
        : "stable"

    subjectTrends.push({
      subjectName: data.name,
      subjectId: sid,
      dataPoints: data.points,
      average: Math.round(avg * 10) / 10,
      trend,
    })

    if (!bestSubject || avg > bestSubject.avg) {
      bestSubject = { name: data.name, avg }
    }
    if (!weakestSubject || avg < weakestSubject.avg) {
      weakestSubject = { name: data.name, avg }
    }
  }

  // 2. Question type performance from MarkingResult + QuestionBank
  const markingResults = await db.markingResult.findMany({
    where: {
      schoolId,
      studentId,
    },
    select: {
      pointsAwarded: true,
      maxPoints: true,
      question: {
        select: {
          questionType: true,
          bloomLevel: true,
        },
      },
    },
  })

  const typeMap = new Map<string, { correct: number; total: number }>()
  const bloomMap = new Map<string, { correct: number; total: number }>()

  for (const mr of markingResults) {
    const awarded = Number(mr.pointsAwarded)
    const max = Number(mr.maxPoints)
    const isCorrect = max > 0 && awarded / max >= 0.5 ? 1 : 0

    // Question type
    const qt = mr.question.questionType
    if (!typeMap.has(qt)) typeMap.set(qt, { correct: 0, total: 0 })
    const typeEntry = typeMap.get(qt)!
    typeEntry.total++
    typeEntry.correct += isCorrect

    // Bloom level
    const bl = mr.question.bloomLevel
    if (!bloomMap.has(bl)) bloomMap.set(bl, { correct: 0, total: 0 })
    const bloomEntry = bloomMap.get(bl)!
    bloomEntry.total++
    bloomEntry.correct += isCorrect
  }

  const questionTypePerformance: QuestionTypePerformance[] = []
  for (const [type, data] of typeMap) {
    questionTypePerformance.push({
      type,
      correct: data.correct,
      total: data.total,
      percentage:
        data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    })
  }

  // Bloom levels in order
  const bloomOrder = [
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE",
  ]
  const bloomPerformance: BloomPerformance[] = bloomOrder
    .filter((level) => bloomMap.has(level))
    .map((level) => {
      const data = bloomMap.get(level)!
      return {
        level,
        correct: data.correct,
        total: data.total,
        percentage:
          data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }
    })

  const overallAverage =
    results.reduce((s, r) => s + r.percentage, 0) / results.length

  return {
    subjectTrends,
    questionTypePerformance,
    bloomPerformance,
    overallAverage: Math.round(overallAverage * 10) / 10,
    totalExams: results.length,
    bestSubject: bestSubject?.name ?? null,
    weakestSubject: weakestSubject?.name ?? null,
  }
}

/**
 * Get children list for a guardian (for child selector)
 */
export async function getGuardianChildren(): Promise<
  { id: string; name: string }[]
> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!schoolId || session?.user?.role !== "GUARDIAN") return []

  const guardian = await db.guardian.findFirst({
    where: { userId: session.user.id, schoolId },
    select: { id: true },
  })
  if (!guardian) return []

  const sgs = await db.studentGuardian.findMany({
    where: { guardianId: guardian.id, schoolId },
    select: {
      student: {
        select: { id: true, givenName: true, surname: true },
      },
    },
  })

  return sgs.map((sg) => ({
    id: sg.student.id,
    name: `${sg.student.givenName || ""} ${sg.student.surname || ""}`.trim(),
  }))
}
