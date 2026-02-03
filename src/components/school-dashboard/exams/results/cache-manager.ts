/**
 * Cache Management for Exam Results
 *
 * Provides functions to:
 * - Invalidate caches when data changes
 * - Warm up caches on demand
 * - Monitor cache performance
 */

import {
  gradeBoundaryCache,
  invalidateCache,
  questionAnalyticsCache,
  schoolBrandingCache,
  schoolCache,
  warmCache,
} from "@/lib/cache/exam-cache"
import { db } from "@/lib/db"

/**
 * Invalidate grade boundaries cache when boundaries are updated
 */
export async function onGradeBoundaryUpdate(schoolId: string) {
  invalidateCache.gradeBoundaries(schoolId)

  // Optionally pre-load new data
  const boundaries = await db.gradeBoundary.findMany({
    where: { schoolId },
    orderBy: { minScore: "desc" },
  })

  if (boundaries.length > 0) {
    gradeBoundaryCache.set(
      `grade-boundaries:${schoolId}`,
      boundaries,
      60 * 60 * 1000 // 1 hour TTL for updated data
    )
  }
}

/**
 * Invalidate school branding cache when branding is updated
 */
export async function onSchoolBrandingUpdate(schoolId: string) {
  invalidateCache.schoolBranding(schoolId)
  invalidateCache.school(schoolId)

  // Optionally pre-load new data
  const [school, branding] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
    }),
    db.schoolBranding.findUnique({
      where: { schoolId },
    }),
  ])

  if (school) {
    schoolCache.set(
      `school:${schoolId}`,
      school,
      2 * 60 * 60 * 1000 // 2 hours TTL
    )
  }

  if (branding) {
    schoolBrandingCache.set(
      `school-branding:${schoolId}`,
      branding,
      2 * 60 * 60 * 1000 // 2 hours TTL
    )
  }
}

/**
 * Warm up caches for a school
 * Call this on server startup or when a school becomes active
 */
export async function warmExamCaches(schoolId: string) {
  try {
    await warmCache.preload(schoolId, db)

    // Additionally, preload recent exam analytics
    const recentExams = await db.exam.findMany({
      where: {
        schoolId,
        examDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: { id: true },
      take: 10,
    })

    // Pre-calculate and cache analytics for recent exams
    for (const exam of recentExams) {
      const analytics = await calculateExamAnalytics(exam.id, schoolId)
      if (analytics) {
        questionAnalyticsCache.set(
          `exam-analytics:${schoolId}:${exam.id}`,
          analytics,
          30 * 60 * 1000 // 30 minutes TTL for analytics
        )
      }
    }

    console.log(`Cache warmed for school: ${schoolId}`)
  } catch (error) {
    console.error(`Failed to warm cache for school ${schoolId}:`, error)
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    gradeBoundaries: gradeBoundaryCache.getStats(),
    schoolBranding: schoolBrandingCache.getStats(),
    school: schoolCache.getStats(),
    questionAnalytics: questionAnalyticsCache.getStats(),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Clear all caches for a school (use sparingly)
 */
export function clearSchoolCaches(schoolId: string) {
  invalidateCache.all(schoolId)
}

/**
 * Calculate exam analytics (helper for cache warming)
 */
async function calculateExamAnalytics(examId: string, schoolId: string) {
  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    include: {
      examResults: {
        select: {
          marksObtained: true,
          totalMarks: true,
          percentage: true,
          grade: true,
        },
      },
      markingResults: {
        select: {
          questionId: true,
          pointsAwarded: true,
          maxPoints: true,
        },
      },
    },
  })

  if (!exam) return null

  // Calculate question-level analytics
  const questionStats = new Map<
    string,
    {
      attempted: number
      correct: number
      totalPoints: number
      maxPoints: number
    }
  >()

  exam.markingResults.forEach((result) => {
    const stats = questionStats.get(result.questionId) || {
      attempted: 0,
      correct: 0,
      totalPoints: 0,
      maxPoints: 0,
    }

    stats.attempted++
    if (Number(result.pointsAwarded) === Number(result.maxPoints)) {
      stats.correct++
    }
    stats.totalPoints += Number(result.pointsAwarded)
    stats.maxPoints = Number(result.maxPoints)

    questionStats.set(result.questionId, stats)
  })

  // Calculate overall analytics
  const passedCount = exam.examResults.filter(
    (r) => r.marksObtained >= exam.passingMarks
  ).length

  return {
    examId,
    totalStudents: exam.examResults.length,
    passedStudents: passedCount,
    failedStudents: exam.examResults.length - passedCount,
    averagePercentage:
      exam.examResults.reduce((sum, r) => sum + r.percentage, 0) /
      exam.examResults.length,
    questionAnalytics: Array.from(questionStats.entries()).map(
      ([questionId, stats]) => ({
        questionId,
        ...stats,
        successRate: (stats.correct / stats.attempted) * 100,
      })
    ),
  }
}
