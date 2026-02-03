/**
 * CGPA (Cumulative GPA) Calculator
 *
 * Calculates weighted cumulative GPA based on:
 * - Credit hours per course
 * - Grade points per course
 * - Exam type weights (midterm, final, etc.)
 *
 * Supports:
 * - Semester GPA
 * - Cumulative GPA across semesters
 * - Weighted vs unweighted averages
 * - Retake handling (best score, latest score, average)
 */

import type { GradingSystem } from "@prisma/client"

import { percentageToGPA4, percentageToGPA5 } from "./grade-converter"

// Course grade for CGPA calculation
export interface CourseGrade {
  courseId: string
  courseName: string
  creditHours: number
  percentage: number // Raw score as percentage
  gradePoint?: number // Pre-calculated grade point
  isRetake?: boolean
  attemptNumber?: number
}

// Exam type weighting configuration
export interface ExamTypeWeights {
  midterm?: number
  final?: number
  quiz?: number
  assignment?: number
  practical?: number
  project?: number
}

// CGPA calculation options
export interface CGPAOptions {
  gpaScale: 4 | 5
  weights?: ExamTypeWeights
  retakePolicy: "best" | "latest" | "average"
  includeCurrentSemester?: boolean
}

// CGPA result
export interface CGPAResult {
  cgpa: number
  totalCredits: number
  totalPoints: number
  semesterGPA?: number
  semesterCredits?: number
}

// Semester data
export interface SemesterData {
  semesterId: string
  semesterName: string
  courses: CourseGrade[]
}

/**
 * Calculate GPA for a single semester
 */
export function calculateSemesterGPA(
  courses: CourseGrade[],
  gpaScale: 4 | 5 = 4
): CGPAResult {
  if (courses.length === 0) {
    return { cgpa: 0, totalCredits: 0, totalPoints: 0 }
  }

  let totalCredits = 0
  let totalPoints = 0

  for (const course of courses) {
    const gradePoint =
      course.gradePoint ??
      (gpaScale === 4
        ? percentageToGPA4(course.percentage)
        : percentageToGPA5(course.percentage))

    totalCredits += course.creditHours
    totalPoints += gradePoint * course.creditHours
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0

  return {
    cgpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
  }
}

/**
 * Calculate cumulative GPA across multiple semesters
 */
export function calculateCumulativeGPA(
  semesters: SemesterData[],
  options: CGPAOptions
): CGPAResult {
  if (semesters.length === 0) {
    return { cgpa: 0, totalCredits: 0, totalPoints: 0 }
  }

  let totalCredits = 0
  let totalPoints = 0
  let currentSemesterCredits = 0
  let currentSemesterPoints = 0

  // Process each semester
  for (let i = 0; i < semesters.length; i++) {
    const semester = semesters[i]
    const isCurrentSemester = i === semesters.length - 1

    // Skip current semester if option is set
    if (isCurrentSemester && !options.includeCurrentSemester) {
      continue
    }

    // Handle retakes
    const processedCourses = handleRetakes(
      semester.courses,
      options.retakePolicy
    )

    // Calculate semester totals
    for (const course of processedCourses) {
      const gradePoint =
        course.gradePoint ??
        (options.gpaScale === 4
          ? percentageToGPA4(course.percentage)
          : percentageToGPA5(course.percentage))

      const points = gradePoint * course.creditHours

      totalCredits += course.creditHours
      totalPoints += points

      if (isCurrentSemester) {
        currentSemesterCredits += course.creditHours
        currentSemesterPoints += points
      }
    }
  }

  const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0
  const semesterGPA =
    currentSemesterCredits > 0
      ? currentSemesterPoints / currentSemesterCredits
      : undefined

  return {
    cgpa: Math.round(cgpa * 100) / 100,
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
    semesterGPA: semesterGPA ? Math.round(semesterGPA * 100) / 100 : undefined,
    semesterCredits: currentSemesterCredits || undefined,
  }
}

/**
 * Handle course retakes based on policy
 */
function handleRetakes(
  courses: CourseGrade[],
  policy: "best" | "latest" | "average"
): CourseGrade[] {
  // Group courses by courseId
  const courseGroups = new Map<string, CourseGrade[]>()

  for (const course of courses) {
    const existing = courseGroups.get(course.courseId) || []
    existing.push(course)
    courseGroups.set(course.courseId, existing)
  }

  // Apply retake policy
  const result: CourseGrade[] = []

  for (const [_, attempts] of courseGroups) {
    if (attempts.length === 1) {
      result.push(attempts[0])
      continue
    }

    // Sort by attempt number
    const sorted = [...attempts].sort(
      (a, b) => (a.attemptNumber || 1) - (b.attemptNumber || 1)
    )

    switch (policy) {
      case "best":
        // Use highest score
        const best = sorted.reduce((max, curr) =>
          curr.percentage > max.percentage ? curr : max
        )
        result.push(best)
        break

      case "latest":
        // Use most recent attempt
        result.push(sorted[sorted.length - 1])
        break

      case "average":
        // Average all attempts
        const avgPercentage =
          sorted.reduce((sum, c) => sum + c.percentage, 0) / sorted.length
        result.push({
          ...sorted[0],
          percentage: avgPercentage,
        })
        break
    }
  }

  return result
}

/**
 * Calculate weighted exam score based on exam type weights
 */
export function calculateWeightedScore(
  scores: Array<{ type: keyof ExamTypeWeights; percentage: number }>,
  weights: ExamTypeWeights
): number {
  let totalWeight = 0
  let weightedSum = 0

  for (const score of scores) {
    const weight = weights[score.type] || 0
    totalWeight += weight
    weightedSum += score.percentage * weight
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

/**
 * Apply retake penalty to a score
 */
export function applyRetakePenalty(
  percentage: number,
  attemptNumber: number,
  penaltyPercent: number
): number {
  if (attemptNumber <= 1) return percentage

  const penalties = (attemptNumber - 1) * penaltyPercent
  return Math.max(0, percentage - penalties)
}

/**
 * Get GPA classification (honors, etc.)
 */
export function getGPAClassification(
  gpa: number,
  scale: 4 | 5 = 4
): {
  classification: string
  latinHonors?: string
} {
  if (scale === 4) {
    if (gpa >= 3.9)
      return { classification: "First Class", latinHonors: "Summa Cum Laude" }
    if (gpa >= 3.7)
      return { classification: "First Class", latinHonors: "Magna Cum Laude" }
    if (gpa >= 3.5)
      return { classification: "First Class", latinHonors: "Cum Laude" }
    if (gpa >= 3.0) return { classification: "Second Class Upper" }
    if (gpa >= 2.5) return { classification: "Second Class Lower" }
    if (gpa >= 2.0) return { classification: "Third Class" }
    return { classification: "Below Standard" }
  } else {
    // 5.0 scale
    if (gpa >= 4.5)
      return { classification: "First Class", latinHonors: "Summa Cum Laude" }
    if (gpa >= 4.0)
      return { classification: "First Class", latinHonors: "Magna Cum Laude" }
    if (gpa >= 3.5)
      return { classification: "First Class", latinHonors: "Cum Laude" }
    if (gpa >= 3.0) return { classification: "Second Class Upper" }
    if (gpa >= 2.5) return { classification: "Second Class Lower" }
    if (gpa >= 2.0) return { classification: "Third Class" }
    return { classification: "Below Standard" }
  }
}

/**
 * Calculate required GPA to reach target CGPA
 */
export function requiredGPAForTarget(
  currentCGPA: number,
  currentCredits: number,
  targetCGPA: number,
  remainingCredits: number
): number | null {
  const totalCredits = currentCredits + remainingCredits
  const currentPoints = currentCGPA * currentCredits
  const targetPoints = targetCGPA * totalCredits
  const neededPoints = targetPoints - currentPoints
  const neededGPA = neededPoints / remainingCredits

  // Check if target is achievable
  if (neededGPA > 4.0) return null // Impossible
  if (neededGPA < 0) return 0 // Already achieved

  return Math.round(neededGPA * 100) / 100
}
