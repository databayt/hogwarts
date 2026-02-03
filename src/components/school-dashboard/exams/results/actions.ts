"use server"

// Results Block Server Actions - Optimized for N+1 Query Prevention
import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  cacheKeys,
  gradeBoundaryCache,
  invalidateCache,
  schoolBrandingCache,
  schoolCache,
  warmCache,
} from "@/lib/cache/exam-cache"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  calculateClassAverage,
  calculateClassAveragePercentage,
  calculateGradeDistribution,
  calculateHighestMarks,
  calculateLowestMarks,
  calculateMarkSummation,
  calculateRanks,
  identifyNeedsAttention,
  identifyTopPerformers,
} from "./lib/calculator"
import {
  applyPDFDefaults,
  generatePDF,
  generatePDFFileName,
} from "./lib/pdf-generator"
import { renderTemplate } from "./lib/templates"
import type {
  PDFResultData,
  ResultAnalytics,
  ResultSummary,
  StudentResultDTO,
} from "./types"
import {
  batchPDFRequestSchema,
  generateSinglePDFSchema,
  getAnalyticsSchema,
  getResultsSchema,
} from "./validation"

// Note: CSV import/export and batch PDF functions are available in separate files:
// - ./actions/csv-import-export (exportExamResultsToCSV, importExamResultsFromCSV, generateResultImportTemplate)
// - ./actions/batch-pdf (generateBatchExamPDFs, generateBatchReportCards, getBatchProgress, downloadBatchZIP, cancelBatchJob)
// Import them directly from those files as needed.

/**
 * Get results for an exam - Optimized with eager loading
 */
export async function getExamResults(input: z.infer<typeof getResultsSchema>) {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) throw new Error("Missing school context")

    const { examId, includeAbsent, includeQuestionBreakdown } =
      getResultsSchema.parse(input)

    // Fetch exam with all necessary relations in a single query
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
        examResults: {
          where: includeAbsent ? {} : { isAbsent: false },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                givenName: true,
                middleName: true,
                surname: true,
              },
            },
          },
          orderBy: { marksObtained: "desc" },
        },
        // Eagerly load marking results if needed to prevent N+1
        ...(includeQuestionBreakdown && {
          markingResults: {
            where: { schoolId },
            select: {
              studentId: true,
              questionId: true,
              pointsAwarded: true,
              maxPoints: true,
              feedback: true,
              question: {
                select: {
                  id: true,
                  questionText: true,
                  questionType: true,
                  points: true,
                },
              },
            },
            orderBy: { questionId: "asc" },
          },
        }),
      },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    // Get grade boundaries from cache or database
    const cacheKey = cacheKeys.gradeBoundaries(schoolId)
    let boundaries = gradeBoundaryCache.get(cacheKey)

    if (!boundaries) {
      // Fetch from database if not cached
      boundaries = await db.gradeBoundary.findMany({
        where: { schoolId },
        orderBy: { minScore: "desc" },
      })

      // Store in cache for future use
      if (boundaries.length > 0) {
        gradeBoundaryCache.set(cacheKey, boundaries)
      }
    }

    // Create boundary lookup map for O(1) access
    const boundaryMap = new Map(
      boundaries.map((b) => {
        const key = `${Number(b.minScore)}-${Number(b.maxScore)}`
        return [key, b]
      })
    )

    // Transform results with optimized boundary lookup
    let results: StudentResultDTO[] = exam.examResults.map(
      (result): StudentResultDTO => {
        // Find matching boundary efficiently
        const boundary = boundaries.find(
          (b) =>
            result.percentage >= Number(b.minScore) &&
            result.percentage <= Number(b.maxScore)
        )

        return {
          id: result.id,
          studentId: result.student.studentId || "",
          studentName:
            `${result.student.givenName} ${result.student.middleName || ""} ${result.student.surname}`.trim(),
          marksObtained: result.marksObtained,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          grade: result.grade,
          gpa: boundary ? Number(boundary.gpaValue) : null,
          rank: 0, // Will be calculated below
          isAbsent: result.isAbsent,
          remarks: result.remarks,
        }
      }
    )

    // Calculate ranks
    results = calculateRanks(results)

    // Add question breakdown if requested (using pre-fetched data)
    if (includeQuestionBreakdown && exam.markingResults) {
      // Group marking results by student for O(1) lookup
      const markingResultsByStudent = exam.markingResults.reduce(
        (acc, mr) => {
          if (!acc[mr.studentId]) {
            acc[mr.studentId] = []
          }
          acc[mr.studentId].push(mr)
          return acc
        },
        {} as Record<string, typeof exam.markingResults>
      )

      // Add question breakdown to each result
      results = results.map((result) => {
        const studentMarkingResults = markingResultsByStudent[result.id] || []

        if (studentMarkingResults.length > 0) {
          result.questionBreakdown = studentMarkingResults.map((mr, index) => {
            const question = (mr as any).question
            return {
              questionNumber: index + 1,
              questionText: question?.questionText || "",
              questionType: question?.questionType || "ESSAY",
              maxPoints: Number(mr.maxPoints),
              pointsAwarded: Number(mr.pointsAwarded),
              isCorrect: mr.pointsAwarded === mr.maxPoints,
              feedback: mr.feedback,
            }
          })
        }

        return result
      })
    }

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    console.error("Get exam results error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get analytics for an exam - Optimized to prevent redundant queries
 */
export async function getExamAnalytics(
  input: z.infer<typeof getAnalyticsSchema>
) {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) throw new Error("Missing school context")

    const { examId } = getAnalyticsSchema.parse(input)

    // Fetch all data in a single optimized query
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
        examResults: {
          where: { isAbsent: false },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                givenName: true,
                middleName: true,
                surname: true,
              },
            },
          },
          orderBy: { marksObtained: "desc" },
        },
        // Include marking results for question analytics
        markingResults: {
          select: {
            questionId: true,
            pointsAwarded: true,
            maxPoints: true,
            status: true,
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                difficulty: true,
                bloomLevel: true,
                points: true,
              },
            },
          },
        },
      },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    // Get grade boundaries from cache or database
    const boundariesCacheKey = cacheKeys.gradeBoundaries(schoolId)
    let boundaries = gradeBoundaryCache.get(boundariesCacheKey)

    if (!boundaries) {
      // Fetch from database if not cached
      boundaries = await db.gradeBoundary.findMany({
        where: { schoolId },
        orderBy: { minScore: "desc" },
      })

      // Store in cache for future use
      if (boundaries.length > 0) {
        gradeBoundaryCache.set(boundariesCacheKey, boundaries)
      }
    }

    // Transform exam results to StudentResultDTO format
    const results: StudentResultDTO[] = exam.examResults.map((result) => {
      const boundary = boundaries.find(
        (b) =>
          result.percentage >= Number(b.minScore) &&
          result.percentage <= Number(b.maxScore)
      )

      return {
        id: result.id,
        studentId: result.student.studentId || "",
        studentName:
          `${result.student.givenName} ${result.student.middleName || ""} ${result.student.surname}`.trim(),
        marksObtained: result.marksObtained,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        grade: result.grade,
        gpa: boundary ? Number(boundary.gpaValue) : null,
        rank: 0,
        isAbsent: result.isAbsent,
        remarks: result.remarks,
      }
    })

    // Calculate ranks
    const rankedResults = calculateRanks(results)

    // Calculate summary statistics
    const summary: ResultSummary = {
      examId: exam.id,
      examTitle: exam.title,
      examDate: exam.examDate,
      className: exam.class.name,
      subjectName: exam.subject.subjectName,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      totalStudents: exam.examResults.length,
      presentStudents: rankedResults.length,
      absentStudents: 0, // Already filtered out absent students
      passedStudents: rankedResults.filter(
        (r) => r.marksObtained >= exam.passingMarks
      ).length,
      failedStudents: rankedResults.filter(
        (r) => r.marksObtained < exam.passingMarks
      ).length,
      averageMarks: calculateClassAverage(rankedResults),
      averagePercentage: calculateClassAveragePercentage(rankedResults),
      highestMarks: calculateHighestMarks(rankedResults),
      lowestMarks: calculateLowestMarks(rankedResults),
      gradeDistribution: calculateGradeDistribution(rankedResults),
    }

    // Calculate grade distribution with details
    const gradeDistribution = Object.entries(summary.gradeDistribution).map(
      ([grade, count]) => {
        const boundary = boundaries.find((b) => b.grade === grade)
        return {
          grade,
          count,
          percentage: (count / summary.presentStudents) * 100,
          gpaValue: boundary ? Number(boundary.gpaValue) : 0,
          color: getGradeColor(grade),
        }
      }
    )

    // Calculate performance trends
    const performanceTrends = [
      {
        range: "90-100",
        count: rankedResults.filter((r) => r.percentage >= 90).length,
        percentage: 0,
      },
      {
        range: "80-89",
        count: rankedResults.filter(
          (r) => r.percentage >= 80 && r.percentage < 90
        ).length,
        percentage: 0,
      },
      {
        range: "70-79",
        count: rankedResults.filter(
          (r) => r.percentage >= 70 && r.percentage < 80
        ).length,
        percentage: 0,
      },
      {
        range: "60-69",
        count: rankedResults.filter(
          (r) => r.percentage >= 60 && r.percentage < 70
        ).length,
        percentage: 0,
      },
      {
        range: "50-59",
        count: rankedResults.filter(
          (r) => r.percentage >= 50 && r.percentage < 60
        ).length,
        percentage: 0,
      },
      {
        range: "0-49",
        count: rankedResults.filter((r) => r.percentage < 50).length,
        percentage: 0,
      },
    ].map((trend) => ({
      ...trend,
      percentage:
        summary.presentStudents > 0
          ? (trend.count / summary.presentStudents) * 100
          : 0,
    }))

    // Calculate question analytics from marking results
    const questionAnalytics =
      exam.markingResults.length > 0
        ? calculateQuestionAnalytics(exam.markingResults)
        : []

    const analytics: ResultAnalytics = {
      examId,
      summary,
      gradeDistribution,
      performanceTrends,
      topPerformers: identifyTopPerformers(rankedResults, 5),
      needsAttention: identifyNeedsAttention(rankedResults, 50, 5),
      questionAnalytics,
    }

    return {
      success: true,
      data: analytics,
    }
  } catch (error) {
    console.error("Get exam analytics error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate single PDF for a student - Optimized with combined queries
 */
export async function generateStudentPDF(
  input: z.infer<typeof generateSinglePDFSchema>
) {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) throw new Error("Missing school context")

    const parsed = generateSinglePDFSchema.parse(input)
    const options = applyPDFDefaults(parsed.options)

    // Try to get cached data first
    const schoolCacheKey = cacheKeys.school(schoolId)
    const brandingCacheKey = cacheKeys.schoolBranding(schoolId)
    const boundariesCacheKey = cacheKeys.gradeBoundaries(schoolId)

    const cachedSchool = schoolCache.get(schoolCacheKey)
    const cachedBranding = schoolBrandingCache.get(brandingCacheKey)
    const cachedBoundaries = gradeBoundaryCache.get(boundariesCacheKey)

    // Fetch all necessary data, using cache where available
    const [examData, school, boundaries] = await Promise.all([
      // Get exam with student result in single query (always fresh)
      db.exam.findFirst({
        where: { id: parsed.examId, schoolId },
        include: {
          class: { select: { name: true } },
          subject: { select: { subjectName: true } },
          examResults: {
            where: {
              studentId: parsed.studentId,
              schoolId,
            },
            include: {
              student: {
                select: {
                  id: true,
                  studentId: true,
                  givenName: true,
                  middleName: true,
                  surname: true,
                },
              },
            },
          },
          // Include marking results if question breakdown needed
          ...(options.includeQuestionBreakdown && {
            markingResults: {
              where: {
                studentId: parsed.studentId,
                schoolId,
              },
              select: {
                questionId: true,
                pointsAwarded: true,
                maxPoints: true,
                feedback: true,
                question: {
                  select: {
                    questionText: true,
                    questionType: true,
                    points: true,
                  },
                },
              },
              orderBy: { questionId: "asc" },
            },
          }),
        },
      }),
      // Get school with branding (from cache if available)
      cachedSchool && cachedBranding
        ? Promise.resolve({ ...cachedSchool, branding: cachedBranding })
        : db.school
            .findFirst({
              where: { id: schoolId },
              include: {
                branding: true,
              },
            })
            .then((result) => {
              // Cache the results
              if (result) {
                schoolCache.set(schoolCacheKey, result)
                if (result.branding) {
                  schoolBrandingCache.set(brandingCacheKey, result.branding)
                }
              }
              return result
            }),
      // Get grade boundaries (from cache if available)
      cachedBoundaries
        ? Promise.resolve(cachedBoundaries)
        : db.gradeBoundary
            .findMany({
              where: { schoolId },
              orderBy: { minScore: "desc" },
            })
            .then((result) => {
              // Cache the results
              if (result.length > 0) {
                gradeBoundaryCache.set(boundariesCacheKey, result)
              }
              return result
            }),
    ])

    if (!examData || !school || examData.examResults.length === 0) {
      return { success: false, error: "Data not found" }
    }

    const studentExamResult = examData.examResults[0]

    // Find grade boundary for GPA
    const boundary = boundaries.find(
      (b) =>
        studentExamResult.percentage >= Number(b.minScore) &&
        studentExamResult.percentage <= Number(b.maxScore)
    )

    // Transform to StudentResultDTO
    const studentResult: StudentResultDTO = {
      id: studentExamResult.id,
      studentId: studentExamResult.student.studentId || "",
      studentName:
        `${studentExamResult.student.givenName} ${studentExamResult.student.middleName || ""} ${studentExamResult.student.surname}`.trim(),
      marksObtained: studentExamResult.marksObtained,
      totalMarks: studentExamResult.totalMarks,
      percentage: studentExamResult.percentage,
      grade: studentExamResult.grade,
      gpa: boundary ? Number(boundary.gpaValue) : null,
      rank: 0, // Will be calculated if needed
      isAbsent: studentExamResult.isAbsent,
      remarks: studentExamResult.remarks,
    }

    // Add question breakdown if available
    if (options.includeQuestionBreakdown && examData.markingResults) {
      studentResult.questionBreakdown = examData.markingResults.map(
        (mr, index) => {
          const question = (mr as any).question
          return {
            questionNumber: index + 1,
            questionText: question?.questionText || "",
            questionType: question?.questionType || "ESSAY",
            maxPoints: Number(mr.maxPoints),
            pointsAwarded: Number(mr.pointsAwarded),
            isCorrect: mr.pointsAwarded === mr.maxPoints,
            feedback: mr.feedback,
          }
        }
      )
    }

    // Get analytics if needed (optimized to reuse data)
    let analytics = undefined
    if (options.includeClassAnalytics) {
      // Get all exam results for ranking and analytics
      const allResults = await db.examResult.findMany({
        where: {
          examId: parsed.examId,
          schoolId,
          isAbsent: false,
        },
        select: {
          id: true,
          marksObtained: true,
          totalMarks: true,
          percentage: true,
          grade: true,
        },
        orderBy: { marksObtained: "desc" },
      })

      // Calculate rank
      const rank =
        allResults.findIndex((r) => r.id === studentExamResult.id) + 1
      studentResult.rank = rank

      // Calculate class statistics
      const classAverage =
        allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length
      const gradeDistribution = calculateGradeDistribution(
        allResults.map((r) => ({
          ...r,
          id: r.id,
          studentId: "",
          studentName: "",
          gpa: null,
          rank: 0,
          isAbsent: false,
          remarks: null,
        }))
      )

      analytics = {
        classAverage,
        classRank: rank,
        totalStudents: allResults.length,
        gradeDistribution: Object.entries(gradeDistribution).map(
          ([grade, count]) => ({
            grade,
            count,
            percentage: (count / allResults.length) * 100,
            gpaValue: boundaries.find((b) => b.grade === grade)
              ? Number(boundaries.find((b) => b.grade === grade)!.gpaValue)
              : 0,
            color: getGradeColor(grade),
          })
        ),
      }
    }

    // Prepare PDF data
    const pdfData: PDFResultData = {
      student: studentResult,
      exam: {
        title: examData.title,
        date: examData.examDate,
        className: examData.class.name,
        subjectName: examData.subject.subjectName,
        totalMarks: examData.totalMarks,
        passingMarks: examData.passingMarks,
      },
      school: {
        name: school.name,
        logo: school.logoUrl || undefined,
        address: school.address || undefined,
        phone: school.phoneNumber || undefined,
        email: school.email || undefined,
      },
      analytics,
      metadata: {
        generatedAt: new Date(),
        generatedBy: schoolId,
        schoolName: school.name,
        academicYear: new Date().getFullYear().toString(),
      },
    }

    // Generate PDF
    const templateComponent = renderTemplate(options.template, pdfData)
    const fileName = generatePDFFileName(
      studentResult.studentName,
      examData.title,
      options.template
    )

    const result = await generatePDF(templateComponent, fileName)

    return {
      success: result.success,
      data: result,
    }
  } catch (error) {
    console.error("Generate student PDF error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Calculate question-level analytics from marking results
 */
function calculateQuestionAnalytics(markingResults: any[]): any[] {
  // Group by question
  const questionGroups = markingResults.reduce(
    (acc, mr) => {
      const qId = mr.questionId
      if (!acc[qId]) {
        acc[qId] = {
          question: mr.question,
          attempts: [],
        }
      }
      acc[qId].attempts.push({
        pointsAwarded: Number(mr.pointsAwarded),
        maxPoints: Number(mr.maxPoints),
      })
      return acc
    },
    {} as Record<string, any>
  )

  // Calculate analytics for each question
  return Object.values(questionGroups).map((group: any) => {
    const totalAttempts = group.attempts.length
    const correctAttempts = group.attempts.filter(
      (a: any) => a.pointsAwarded === a.maxPoints
    ).length
    const totalPoints = group.attempts.reduce(
      (sum: number, a: any) => sum + a.pointsAwarded,
      0
    )
    const maxPossiblePoints = group.attempts.reduce(
      (sum: number, a: any) => sum + a.maxPoints,
      0
    )

    return {
      questionId: group.question.id,
      questionText: group.question.questionText,
      questionType: group.question.questionType,
      difficulty: group.question.difficulty,
      bloomLevel: group.question.bloomLevel,
      totalAttempts,
      correctAttempts,
      incorrectAttempts: totalAttempts - correctAttempts,
      successRate: (correctAttempts / totalAttempts) * 100,
      averageScore: totalPoints / totalAttempts,
      maxPoints: group.question.points,
      averagePercentage: (totalPoints / maxPossiblePoints) * 100,
    }
  })
}

/**
 * Helper function to get grade color
 */
function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    "A+": "#10B981",
    A: "#34D399",
    "B+": "#60A5FA",
    B: "#3B82F6",
    "C+": "#FBBF24",
    C: "#F59E0B",
    D: "#F97316",
    F: "#EF4444",
  }

  return colors[grade] || "#6B7280"
}
