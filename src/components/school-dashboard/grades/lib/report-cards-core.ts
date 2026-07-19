// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Report-card aggregation core — a plain (NOT "use server") helper so it can be
 * called BOTH by the tenant-authed `generateReportCards` action AND by the
 * term-end cron (which has no session and passes an explicit `schoolId` read
 * from the term row). Mirrors the gradebook-spine pattern: the auth/tenant
 * guard lives in the action wrapper; this core takes `schoolId` as a param and
 * scopes every query by it.
 */
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

interface SubjectGradeData {
  subjectId: string
  name: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  credits: number
}

interface GradeBoundary {
  grade: string
  minScore: number
  maxScore: number
  gpa4?: number
  gpa5?: number
}

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { grade: "A+", minScore: 97, maxScore: 100, gpa4: 4.0, gpa5: 5.0 },
  { grade: "A", minScore: 93, maxScore: 96, gpa4: 4.0, gpa5: 4.75 },
  { grade: "A-", minScore: 90, maxScore: 92, gpa4: 3.7, gpa5: 4.5 },
  { grade: "B+", minScore: 87, maxScore: 89, gpa4: 3.3, gpa5: 4.0 },
  { grade: "B", minScore: 83, maxScore: 86, gpa4: 3.0, gpa5: 3.75 },
  { grade: "B-", minScore: 80, maxScore: 82, gpa4: 2.7, gpa5: 3.5 },
  { grade: "C+", minScore: 77, maxScore: 79, gpa4: 2.3, gpa5: 3.0 },
  { grade: "C", minScore: 73, maxScore: 76, gpa4: 2.0, gpa5: 2.75 },
  { grade: "C-", minScore: 70, maxScore: 72, gpa4: 1.7, gpa5: 2.5 },
  { grade: "D+", minScore: 67, maxScore: 69, gpa4: 1.3, gpa5: 2.0 },
  { grade: "D", minScore: 60, maxScore: 66, gpa4: 1.0, gpa5: 1.5 },
  { grade: "F", minScore: 0, maxScore: 59, gpa4: 0, gpa5: 0 },
]

function percentageToGrade(
  pct: number,
  boundaries: GradeBoundary[]
): { grade: string; gpa: number } {
  const rounded = Math.round(pct)
  for (const b of boundaries) {
    if (rounded >= b.minScore && rounded <= b.maxScore) {
      return { grade: b.grade, gpa: b.gpa4 ?? 0 }
    }
  }
  return { grade: "F", gpa: 0 }
}

export interface GenerateReportCardsInput {
  termId: string
  gradeId?: string
  classId?: string
}

/**
 * Aggregate exam/gradebook results for a term into `ReportCard` +
 * `ReportCardGrade` rows (idempotent via the `schoolId_studentId_termId`
 * unique key). Does NOT publish — the admin reviews then publishes.
 */
export async function generateReportCardsCore(
  schoolId: string,
  input: GenerateReportCardsInput
): Promise<
  ActionResponse<{ created: number; updated: number; skipped: number }>
> {
  try {
    // Fetch grading config
    const gradingConfig = await db.schoolGradingConfig.findUnique({
      where: { schoolId },
    })
    const boundaries = gradingConfig?.customBoundaries
      ? (gradingConfig.customBoundaries as unknown as GradeBoundary[])
      : DEFAULT_BOUNDARIES

    // Build student query
    const studentWhere: Record<string, unknown> = { schoolId }
    if (input.classId) {
      studentWhere.studentClasses = { some: { classId: input.classId } }
    } else if (input.gradeId) {
      studentWhere.academicGradeId = input.gradeId
    }

    // Fetch all enrolled students
    const students = await db.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        academicGradeId: true,
        studentClasses: {
          select: {
            classId: true,
            class: {
              select: {
                id: true,
                subjectId: true,
                termId: true,
                credits: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (students.length === 0) {
      return { success: true, data: { created: 0, updated: 0, skipped: 0 } }
    }

    // Fetch term info
    const term = await db.term.findFirst({
      where: { id: input.termId, schoolId },
    })
    if (!term) {
      return { success: false, error: "Term not found" }
    }

    let created = 0
    let updated = 0
    let skipped = 0

    // Collect all student GPAs for ranking
    const studentGPAs: Array<{ studentId: string; gpa: number }> = []

    for (const student of students) {
      const subjectGrades: SubjectGradeData[] = []

      for (const sc of student.studentClasses) {
        const cls = sc.class
        if (!cls.subjectId) continue
        if (cls.termId !== input.termId) continue

        // Fetch exam results for this student, class, and term
        const examResults = await db.examResult.findMany({
          where: {
            schoolId,
            studentId: student.id,
            exam: { classId: cls.id },
          },
          select: {
            examId: true,
            marksObtained: true,
            totalMarks: true,
            percentage: true,
          },
        })

        // Fetch standalone results (including those that originated from an
        // auto-marked exam and therefore carry an examId).
        const standaloneResults = await db.result.findMany({
          where: {
            schoolId,
            studentId: student.id,
            classId: cls.id,
          },
          select: { examId: true, score: true, maxScore: true },
        })

        // Build a set of examIds already covered by a Result row so that we
        // avoid counting those exams twice (once via ExamResult, once via
        // Result). When both rows exist, the Result row wins — it may carry
        // richer weighting data written by upsertGradebookResult.
        const resultExamIds = new Set(
          standaloneResults
            .map((r) => r.examId)
            .filter((id): id is string => id !== null && id !== undefined)
        )

        // Combine scores -- simple average for now.
        // Filter out any ExamResult whose examId is already represented by a
        // Result row so each exam contributes exactly once.
        const allScores = [
          ...examResults
            .filter((r) => !resultExamIds.has(r.examId))
            .map((r) => ({
              score: r.marksObtained,
              maxScore: r.totalMarks || 100,
            })),
          ...standaloneResults.map((r) => ({
            score: Number(r.score),
            maxScore: Number(r.maxScore),
          })),
        ]

        if (allScores.length === 0) continue

        const totalScore = allScores.reduce((sum, s) => sum + s.score, 0)
        const totalMax = allScores.reduce((sum, s) => sum + s.maxScore, 0)
        const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0
        const { grade } = percentageToGrade(pct, boundaries)

        subjectGrades.push({
          subjectId: cls.subjectId,
          name: cls.subject?.name || "",
          score: totalScore,
          maxScore: totalMax,
          percentage: Math.round(pct * 100) / 100,
          grade,
          credits: cls.credits ? Number(cls.credits) : 1,
        })
      }

      if (subjectGrades.length === 0) {
        skipped++
        continue
      }

      // Calculate overall GPA (weighted by credits)
      const totalCredits = subjectGrades.reduce(
        (sum, sg) => sum + sg.credits,
        0
      )
      const weightedGPA =
        totalCredits > 0
          ? subjectGrades.reduce((sum, sg) => {
              const { gpa } = percentageToGrade(sg.percentage, boundaries)
              return sum + gpa * sg.credits
            }, 0) / totalCredits
          : 0

      const overallPct =
        subjectGrades.reduce((sum, sg) => sum + sg.percentage, 0) /
        subjectGrades.length
      const { grade: overallGrade } = percentageToGrade(overallPct, boundaries)

      studentGPAs.push({ studentId: student.id, gpa: weightedGPA })

      // Fetch attendance summary for this student and term
      const attendanceSummary = await db.attendance.groupBy({
        by: ["status"],
        where: {
          schoolId,
          studentId: student.id,
          date: { gte: term.startDate, lte: term.endDate },
        },
        _count: { status: true },
      })

      const daysPresent =
        attendanceSummary.find((a) => a.status === "PRESENT")?._count.status ??
        0
      const daysAbsent =
        attendanceSummary.find((a) => a.status === "ABSENT")?._count.status ?? 0
      const daysLate =
        attendanceSummary.find((a) => a.status === "LATE")?._count.status ?? 0

      // Upsert ReportCard
      const yearLevelId = student.academicGradeId
        ? (
            await db.academicGrade.findUnique({
              where: { id: student.academicGradeId },
              select: { yearLevelId: true },
            })
          )?.yearLevelId
        : undefined

      const existing = await db.reportCard.findUnique({
        where: {
          schoolId_studentId_termId: {
            schoolId,
            studentId: student.id,
            termId: input.termId,
          },
        },
      })

      if (existing) {
        await db.reportCard.update({
          where: { id: existing.id },
          data: {
            overallGrade,
            overallGPA: Math.round(weightedGPA * 100) / 100,
            daysPresent,
            daysAbsent,
            daysLate,
            yearLevelId: yearLevelId || undefined,
          },
        })

        // Delete old grades and re-create
        await db.reportCardGrade.deleteMany({
          where: { reportCardId: existing.id },
        })

        await db.reportCardGrade.createMany({
          data: subjectGrades.map((sg) => ({
            schoolId,
            reportCardId: existing.id,
            subjectId: sg.subjectId,
            grade: sg.grade,
            score: sg.score,
            maxScore: sg.maxScore,
            percentage: sg.percentage,
            credits: sg.credits,
          })),
        })

        updated++
      } else {
        const reportCard = await db.reportCard.create({
          data: {
            schoolId,
            studentId: student.id,
            termId: input.termId,
            yearLevelId: yearLevelId || undefined,
            overallGrade,
            overallGPA: Math.round(weightedGPA * 100) / 100,
            daysPresent,
            daysAbsent,
            daysLate,
          },
        })

        await db.reportCardGrade.createMany({
          data: subjectGrades.map((sg) => ({
            schoolId,
            reportCardId: reportCard.id,
            subjectId: sg.subjectId,
            grade: sg.grade,
            score: sg.score,
            maxScore: sg.maxScore,
            percentage: sg.percentage,
            credits: sg.credits,
          })),
        })

        created++
      }
    }

    // Calculate ranks
    studentGPAs.sort((a, b) => b.gpa - a.gpa)
    const totalStudents = studentGPAs.length
    for (let i = 0; i < studentGPAs.length; i++) {
      const rank = i + 1
      await db.reportCard.updateMany({
        where: {
          schoolId,
          studentId: studentGPAs[i].studentId,
          termId: input.termId,
        },
        data: { rank, totalStudents },
      })
    }

    revalidatePath("/grades/reports")

    return { success: true, data: { created, updated, skipped } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate report cards",
    }
  }
}
