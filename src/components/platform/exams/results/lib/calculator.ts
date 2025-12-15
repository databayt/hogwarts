// Results Calculator - Mark Summation and Grade Calculation

import type { GradeBoundary } from "@prisma/client"

import type {
  GradeCalculationResult,
  MarkSummation,
  StudentResultDTO,
} from "../types"

/**
 * Calculate grade based on percentage and grade boundaries
 */
export function calculateGrade(
  percentage: number,
  boundaries: GradeBoundary[]
): GradeCalculationResult {
  // Sort boundaries by minScore descending
  const sortedBoundaries = boundaries.sort(
    (a, b) => Number(b.minScore) - Number(a.minScore)
  )

  // Find matching grade boundary
  for (const boundary of sortedBoundaries) {
    const min = Number(boundary.minScore)
    const max = Number(boundary.maxScore)

    if (percentage >= min && percentage <= max) {
      return {
        grade: boundary.grade,
        gpaValue: Number(boundary.gpaValue),
        color: getGradeColor(boundary.grade),
        description: getGradeDescription(boundary.grade),
      }
    }
  }

  // Default to F if no boundary matches
  return {
    grade: "F",
    gpaValue: 0,
    color: "#EF4444",
    description: "Fail",
  }
}

/**
 * Get color for grade
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

/**
 * Get description for grade
 */
function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    "A+": "Excellent",
    A: "Very Good",
    "B+": "Good",
    B: "Above Average",
    "C+": "Average",
    C: "Satisfactory",
    D: "Pass",
    F: "Fail",
  }

  return descriptions[grade] || "Unknown"
}

/**
 * Calculate mark summation for a student
 */
export function calculateMarkSummation(
  marksObtained: number,
  totalMarks: number,
  passingMarks: number,
  boundaries: GradeBoundary[]
): MarkSummation {
  const percentage = (marksObtained / totalMarks) * 100
  const gradeResult = calculateGrade(percentage, boundaries)

  return {
    totalMarks,
    marksObtained,
    percentage: Math.round(percentage * 100) / 100,
    grade: gradeResult.grade,
    gpa: gradeResult.gpaValue,
    passFail: marksObtained >= passingMarks ? "Pass" : "Fail",
  }
}

/**
 * Calculate class average
 */
export function calculateClassAverage(results: StudentResultDTO[]): number {
  if (results.length === 0) return 0

  const total = results.reduce((sum, result) => {
    if (!result.isAbsent) {
      return sum + result.marksObtained
    }
    return sum
  }, 0)

  const presentStudents = results.filter((r) => !r.isAbsent).length

  return presentStudents > 0 ? total / presentStudents : 0
}

/**
 * Calculate class average percentage
 */
export function calculateClassAveragePercentage(
  results: StudentResultDTO[]
): number {
  if (results.length === 0) return 0

  const total = results.reduce((sum, result) => {
    if (!result.isAbsent) {
      return sum + result.percentage
    }
    return sum
  }, 0)

  const presentStudents = results.filter((r) => !r.isAbsent).length

  return presentStudents > 0 ? total / presentStudents : 0
}

/**
 * Calculate highest marks
 */
export function calculateHighestMarks(results: StudentResultDTO[]): number {
  const presentResults = results.filter((r) => !r.isAbsent)
  if (presentResults.length === 0) return 0

  return Math.max(...presentResults.map((r) => r.marksObtained))
}

/**
 * Calculate lowest marks
 */
export function calculateLowestMarks(results: StudentResultDTO[]): number {
  const presentResults = results.filter((r) => !r.isAbsent)
  if (presentResults.length === 0) return 0

  return Math.min(...presentResults.map((r) => r.marksObtained))
}

/**
 * Calculate grade distribution
 */
export function calculateGradeDistribution(
  results: StudentResultDTO[]
): Record<string, number> {
  const distribution: Record<string, number> = {}

  results.forEach((result) => {
    if (!result.isAbsent && result.grade) {
      distribution[result.grade] = (distribution[result.grade] || 0) + 1
    }
  })

  return distribution
}

/**
 * Calculate pass/fail statistics
 */
export function calculatePassFailStats(
  results: StudentResultDTO[],
  passingMarks: number
) {
  const presentResults = results.filter((r) => !r.isAbsent)

  const passed = presentResults.filter((r) => r.marksObtained >= passingMarks)
  const failed = presentResults.filter((r) => r.marksObtained < passingMarks)

  return {
    total: presentResults.length,
    passed: passed.length,
    failed: failed.length,
    passPercentage:
      presentResults.length > 0
        ? (passed.length / presentResults.length) * 100
        : 0,
  }
}

/**
 * Calculate student rank
 */
export function calculateRanks(
  results: StudentResultDTO[]
): StudentResultDTO[] {
  // Sort by marks obtained (descending)
  const sorted = [...results]
    .filter((r) => !r.isAbsent)
    .sort((a, b) => b.marksObtained - a.marksObtained)

  // Assign ranks (handle ties)
  let currentRank = 1
  let previousMarks = -1
  let studentsWithSameMarks = 0

  return sorted.map((result, index) => {
    if (result.marksObtained === previousMarks) {
      studentsWithSameMarks++
    } else {
      currentRank = index + 1
      studentsWithSameMarks = 0
      previousMarks = result.marksObtained
    }

    return {
      ...result,
      rank: currentRank,
    }
  })
}

/**
 * Calculate GPA from percentage
 */
export function calculateGPA(
  percentage: number,
  boundaries: GradeBoundary[]
): number {
  const gradeResult = calculateGrade(percentage, boundaries)
  return gradeResult.gpaValue
}

/**
 * Calculate cumulative GPA from multiple exams
 */
export function calculateCumulativeGPA(
  exams: Array<{ percentage: number; credits: number }>,
  boundaries: GradeBoundary[]
): number {
  if (exams.length === 0) return 0

  const totalCredits = exams.reduce((sum, exam) => sum + exam.credits, 0)
  if (totalCredits === 0) return 0

  const weightedSum = exams.reduce((sum, exam) => {
    const gpa = calculateGPA(exam.percentage, boundaries)
    return sum + gpa * exam.credits
  }, 0)

  return Math.round((weightedSum / totalCredits) * 100) / 100
}

/**
 * Calculate percentile rank
 */
export function calculatePercentileRank(
  studentMarks: number,
  allMarks: number[]
): number {
  const sortedMarks = [...allMarks].sort((a, b) => a - b)
  const belowCount = sortedMarks.filter((mark) => mark < studentMarks).length

  return (belowCount / sortedMarks.length) * 100
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(marks: number[]): number {
  if (marks.length === 0) return 0

  const mean = marks.reduce((sum, mark) => sum + mark, 0) / marks.length
  const squaredDiffs = marks.map((mark) => Math.pow(mark - mean, 2))
  const variance =
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / marks.length

  return Math.sqrt(variance)
}

/**
 * Calculate z-score for a student
 */
export function calculateZScore(
  studentMarks: number,
  allMarks: number[]
): number {
  if (allMarks.length === 0) return 0

  const mean = allMarks.reduce((sum, mark) => sum + mark, 0) / allMarks.length
  const stdDev = calculateStandardDeviation(allMarks)

  if (stdDev === 0) return 0

  return (studentMarks - mean) / stdDev
}

/**
 * Identify top performers
 */
export function identifyTopPerformers(
  results: StudentResultDTO[],
  count: number = 5
): StudentResultDTO[] {
  const rankedResults = calculateRanks(results)
  return rankedResults.slice(0, count)
}

/**
 * Identify students needing attention
 */
export function identifyNeedsAttention(
  results: StudentResultDTO[],
  threshold: number = 50,
  count: number = 5
): StudentResultDTO[] {
  const needsHelp = results
    .filter((r) => !r.isAbsent && r.percentage < threshold)
    .sort((a, b) => a.percentage - b.percentage)

  return needsHelp.slice(0, count)
}

/**
 * Calculate improvement from previous exam
 */
export function calculateImprovement(
  currentMarks: number,
  previousMarks: number
): {
  difference: number
  percentageChange: number
  improved: boolean
} {
  const difference = currentMarks - previousMarks
  const percentageChange =
    previousMarks > 0 ? (difference / previousMarks) * 100 : 0

  return {
    difference,
    percentageChange: Math.round(percentageChange * 100) / 100,
    improved: difference > 0,
  }
}

/**
 * Format marks for display
 */
export function formatMarks(
  obtained: number,
  total: number,
  showPercentage: boolean = true
): string {
  const percentage = (obtained / total) * 100
  const roundedPercentage = Math.round(percentage * 100) / 100

  if (showPercentage) {
    return `${obtained}/${total} (${roundedPercentage}%)`
  }

  return `${obtained}/${total}`
}

/**
 * Format GPA for display
 */
export function formatGPA(gpa: number, decimals: number = 2): string {
  return gpa.toFixed(decimals)
}

/**
 * Get performance level based on percentage
 */
export function getPerformanceLevel(percentage: number): {
  level: string
  color: string
  description: string
} {
  if (percentage >= 90) {
    return {
      level: "Excellent",
      color: "#10B981",
      description: "Outstanding performance",
    }
  } else if (percentage >= 80) {
    return {
      level: "Very Good",
      color: "#34D399",
      description: "Above expectations",
    }
  } else if (percentage >= 70) {
    return {
      level: "Good",
      color: "#60A5FA",
      description: "Meets expectations",
    }
  } else if (percentage >= 60) {
    return {
      level: "Satisfactory",
      color: "#FBBF24",
      description: "Acceptable performance",
    }
  } else if (percentage >= 50) {
    return {
      level: "Pass",
      color: "#F59E0B",
      description: "Minimum requirements met",
    }
  } else {
    return {
      level: "Needs Improvement",
      color: "#EF4444",
      description: "Below expectations",
    }
  }
}
