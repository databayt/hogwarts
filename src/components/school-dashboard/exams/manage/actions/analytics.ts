"use server"

import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse, ExamAnalytics } from "./types"

/**
 * Get comprehensive analytics for an exam
 */
export async function getExamAnalytics(input: {
  examId: string
}): Promise<ActionResponse<ExamAnalytics>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const { examId } = z.object({ examId: z.string().min(1) }).parse(input)

    // Fetch exam and results in parallel
    const [exam, results] = await Promise.all([
      db.exam.findFirst({
        where: { id: examId, schoolId },
        select: {
          id: true,
          title: true,
          totalMarks: true,
          passingMarks: true,
        },
      }),
      db.examResult.findMany({
        where: { examId, schoolId },
        select: {
          marksObtained: true,
          percentage: true,
          grade: true,
          isAbsent: true,
        },
      }),
    ])

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Calculate statistics
    const totalStudents = results.length
    const presentStudents = results.filter((r) => !r.isAbsent).length
    const absentStudents = results.filter((r) => r.isAbsent).length

    const presentResults = results.filter((r) => !r.isAbsent)
    const passedStudents = presentResults.filter(
      (r) => r.marksObtained >= exam.passingMarks
    ).length
    const failedStudents = presentResults.filter(
      (r) => r.marksObtained < exam.passingMarks
    ).length

    const averageMarks =
      presentResults.length > 0
        ? presentResults.reduce((sum, r) => sum + r.marksObtained, 0) /
          presentResults.length
        : 0

    const averagePercentage =
      presentResults.length > 0
        ? presentResults.reduce((sum, r) => sum + r.percentage, 0) /
          presentResults.length
        : 0

    const highestMarks =
      presentResults.length > 0
        ? Math.max(...presentResults.map((r) => r.marksObtained))
        : 0
    const lowestMarks =
      presentResults.length > 0
        ? Math.min(...presentResults.map((r) => r.marksObtained))
        : 0

    // Grade distribution
    const gradeDistribution = presentResults.reduce(
      (acc, r) => {
        if (r.grade) {
          acc[r.grade] = (acc[r.grade] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>
    )

    const analytics: ExamAnalytics = {
      examTitle: exam.title,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      totalStudents,
      presentStudents,
      absentStudents,
      passedStudents,
      failedStudents,
      passPercentage:
        presentStudents > 0 ? (passedStudents / presentStudents) * 100 : 0,
      averageMarks: Math.round(averageMarks * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      highestMarks,
      lowestMarks,
      gradeDistribution,
    }

    return {
      success: true,
      data: analytics,
    }
  } catch (error) {
    console.error("Error getting exam analytics:", error)
    return {
      success: false,
      error: "Failed to get exam analytics",
      code: "ANALYTICS_FAILED",
    }
  }
}

/**
 * Get class-wise performance analytics
 */
export async function getClassPerformance(input: {
  classId: string
  termId?: string
}): Promise<
  ActionResponse<{
    className: string
    exams: Array<{
      examTitle: string
      averageScore: number
      passRate: number
    }>
    overallAverage: number
    overallPassRate: number
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const { classId, termId } = input

    // Get class details
    const classData = await db.class.findFirst({
      where: { id: classId, schoolId },
      select: { name: true },
    })

    if (!classData) {
      return {
        success: false,
        error: "Class not found",
        code: "CLASS_NOT_FOUND",
      }
    }

    // Get exams for the class
    const where: Record<string, unknown> = {
      classId,
      schoolId,
      status: "COMPLETED",
    }

    if (termId) {
      where.termId = termId
    }

    const exams = await db.exam.findMany({
      where,
      include: {
        examResults: {
          select: {
            marksObtained: true,
            totalMarks: true,
            isAbsent: true,
          },
        },
      },
    })

    // Calculate performance for each exam
    const examPerformance = exams.map((exam) => {
      const presentResults = exam.examResults.filter((r) => !r.isAbsent)
      const averageScore =
        presentResults.length > 0
          ? presentResults.reduce((sum, r) => sum + r.marksObtained, 0) /
            presentResults.length
          : 0
      const passRate =
        presentResults.length > 0
          ? (presentResults.filter((r) => r.marksObtained >= exam.passingMarks)
              .length /
              presentResults.length) *
            100
          : 0

      return {
        examTitle: exam.title,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
      }
    })

    // Calculate overall statistics
    const overallAverage =
      examPerformance.length > 0
        ? examPerformance.reduce((sum, e) => sum + e.averageScore, 0) /
          examPerformance.length
        : 0
    const overallPassRate =
      examPerformance.length > 0
        ? examPerformance.reduce((sum, e) => sum + e.passRate, 0) /
          examPerformance.length
        : 0

    return {
      success: true,
      data: {
        className: classData.name,
        exams: examPerformance,
        overallAverage: Math.round(overallAverage * 100) / 100,
        overallPassRate: Math.round(overallPassRate * 100) / 100,
      },
    }
  } catch (error) {
    console.error("Error getting class performance:", error)
    return {
      success: false,
      error: "Failed to get class performance",
      code: "PERFORMANCE_FAILED",
    }
  }
}

/**
 * Get subject-wise analytics
 */
export async function getSubjectAnalytics(input: {
  subjectId: string
  startDate?: Date
  endDate?: Date
}): Promise<
  ActionResponse<{
    subjectName: string
    totalExams: number
    averageScore: number
    passRate: number
    topicPerformance: Record<string, number>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const { subjectId, startDate, endDate } = input

    // Get subject details
    const subject = await db.subject.findFirst({
      where: { id: subjectId, schoolId },
      select: { subjectName: true },
    })

    if (!subject) {
      return {
        success: false,
        error: "Subject not found",
        code: "SUBJECT_NOT_FOUND",
      }
    }

    // Build query
    const where: Record<string, unknown> = {
      subjectId,
      schoolId,
      status: "COMPLETED",
    }

    if (startDate && endDate) {
      where.examDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Get exams and results
    const exams = await db.exam.findMany({
      where,
      include: {
        examResults: {
          select: {
            marksObtained: true,
            totalMarks: true,
            isAbsent: true,
          },
        },
      },
    })

    // Calculate overall statistics
    let totalMarks = 0
    let totalMaxMarks = 0
    let totalPassed = 0
    let totalPresent = 0

    exams.forEach((exam) => {
      const presentResults = exam.examResults.filter((r) => !r.isAbsent)
      presentResults.forEach((result) => {
        totalMarks += result.marksObtained
        totalMaxMarks += result.totalMarks
        if (result.marksObtained >= exam.passingMarks) {
          totalPassed++
        }
        totalPresent++
      })
    })

    const averageScore =
      totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0
    const passRate = totalPresent > 0 ? (totalPassed / totalPresent) * 100 : 0

    // TODO: Implement topic performance tracking
    // This would require a topic field in the exam or question models
    const topicPerformance: Record<string, number> = {}

    return {
      success: true,
      data: {
        subjectName: subject.subjectName,
        totalExams: exams.length,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        topicPerformance,
      },
    }
  } catch (error) {
    console.error("Error getting subject analytics:", error)
    return {
      success: false,
      error: "Failed to get subject analytics",
      code: "ANALYTICS_FAILED",
    }
  }
}
