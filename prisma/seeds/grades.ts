/**
 * Grades Seed
 * Creates Grade Boundaries and Report Cards
 *
 * Phase 8: Exams, QBank & Grades
 *
 * Note: Model is GradeBoundary (not ScoreRange)
 * - GradeBoundary has @@unique([schoolId, grade])
 * - ReportCard has @@unique([schoolId, studentId, termId])
 * - ReportCard uses overallGrade, overallGPA (not grade, gpa)
 */

import type { PrismaClient } from "@prisma/client"

import { GRADE_SCALE } from "./constants"
import type { StudentRef, TermRef, YearLevelRef } from "./types"
import { getRandomScore, logSuccess, processBatch } from "./utils"

// ============================================================================
// GRADE BOUNDARIES SEEDING
// ============================================================================

/**
 * Seed grade boundaries (grading scale)
 * Note: Model is GradeBoundary with @@unique([schoolId, grade])
 */
export async function seedGradeBoundaries(
  prisma: PrismaClient,
  schoolId: string
): Promise<void> {
  for (const gradeInfo of GRADE_SCALE) {
    try {
      await prisma.gradeBoundary.upsert({
        where: {
          schoolId_grade: {
            schoolId,
            grade: gradeInfo.grade,
          },
        },
        update: {
          minScore: gradeInfo.minScore,
          maxScore: gradeInfo.maxScore,
          gpaValue: gradeInfo.gpa,
        },
        create: {
          schoolId,
          grade: gradeInfo.grade,
          minScore: gradeInfo.minScore,
          maxScore: gradeInfo.maxScore,
          gpaValue: gradeInfo.gpa,
        },
      })
    } catch {
      // Skip if grade boundary already exists
    }
  }

  logSuccess("Grade Boundaries", GRADE_SCALE.length, "A+ to F")
}

// ============================================================================
// REPORT CARDS SEEDING
// ============================================================================

/**
 * Seed report cards for students
 * Note: ReportCard has @@unique([schoolId, studentId, termId])
 * Uses overallGrade, overallGPA (not grade, gpa)
 */
export async function seedReportCards(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  yearLevels: YearLevelRef[],
  term: TermRef
): Promise<number> {
  let reportCount = 0

  await processBatch(students, 50, async (student) => {
    if (!student.yearLevelId) return

    const yearLevel = yearLevels.find((yl) => yl.id === student.yearLevelId)
    if (!yearLevel) return

    // Generate GPA based on random scores
    const averageScore = getRandomScore(100)
    const gpa = (averageScore / 100) * 4.0

    // Determine grade based on score
    const gradeInfo =
      GRADE_SCALE.find(
        (g) => averageScore >= g.minScore && averageScore <= g.maxScore
      ) || GRADE_SCALE[GRADE_SCALE.length - 1]

    try {
      await prisma.reportCard.upsert({
        where: {
          schoolId_studentId_termId: {
            schoolId,
            studentId: student.id,
            termId: term.id,
          },
        },
        update: {
          overallGPA: Math.round(gpa * 100) / 100,
          overallGrade: gradeInfo.grade,
        },
        create: {
          schoolId,
          studentId: student.id,
          termId: term.id,
          yearLevelId: yearLevel.id,
          overallGPA: Math.round(gpa * 100) / 100,
          overallGrade: gradeInfo.grade,
          rank: null, // Will be calculated later
          isPublished: true,
          publishedAt: new Date(),
        },
      })
      reportCount++
    } catch {
      // Skip if report card already exists
    }
  })

  logSuccess("Report Cards", reportCount, "with GPA and grades")

  return reportCount
}

// ============================================================================
// COMBINED GRADES SEEDING
// ============================================================================

/**
 * Seed all grading data
 */
export async function seedGrades(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  yearLevels: YearLevelRef[],
  term: TermRef
): Promise<number> {
  await seedGradeBoundaries(prisma, schoolId)
  return await seedReportCards(prisma, schoolId, students, yearLevels, term)
}
