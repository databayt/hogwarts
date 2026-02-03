/**
 * Grade Conversion Utilities
 *
 * Converts between different grading systems:
 * - Percentage (0-100)
 * - GPA 4.0 scale
 * - GPA 5.0 scale
 * - Letter grades (A+ to F)
 * - CGPA (cumulative)
 *
 * Supports custom grade boundaries and rounding preferences.
 */

import type { GradingSystem } from "@prisma/client"

// Default grade boundaries (US standard)
export const DEFAULT_GRADE_BOUNDARIES = [
  { grade: "A+", minScore: 97, maxScore: 100, gpa4: 4.0, gpa5: 5.0 },
  { grade: "A", minScore: 93, maxScore: 96.99, gpa4: 4.0, gpa5: 5.0 },
  { grade: "A-", minScore: 90, maxScore: 92.99, gpa4: 3.7, gpa5: 4.7 },
  { grade: "B+", minScore: 87, maxScore: 89.99, gpa4: 3.3, gpa5: 4.3 },
  { grade: "B", minScore: 83, maxScore: 86.99, gpa4: 3.0, gpa5: 4.0 },
  { grade: "B-", minScore: 80, maxScore: 82.99, gpa4: 2.7, gpa5: 3.7 },
  { grade: "C+", minScore: 77, maxScore: 79.99, gpa4: 2.3, gpa5: 3.3 },
  { grade: "C", minScore: 73, maxScore: 76.99, gpa4: 2.0, gpa5: 3.0 },
  { grade: "C-", minScore: 70, maxScore: 72.99, gpa4: 1.7, gpa5: 2.7 },
  { grade: "D+", minScore: 67, maxScore: 69.99, gpa4: 1.3, gpa5: 2.3 },
  { grade: "D", minScore: 63, maxScore: 66.99, gpa4: 1.0, gpa5: 2.0 },
  { grade: "D-", minScore: 60, maxScore: 62.99, gpa4: 0.7, gpa5: 1.7 },
  { grade: "F", minScore: 0, maxScore: 59.99, gpa4: 0.0, gpa5: 0.0 },
]

// Grade boundary type
export interface GradeBoundary {
  grade: string
  minScore: number
  maxScore: number
  gpa4: number
  gpa5: number
}

// Conversion options
export interface ConversionOptions {
  boundaries?: GradeBoundary[]
  roundingMethod?: "round" | "floor" | "ceil"
  decimalPlaces?: number
}

/**
 * Apply rounding based on method
 */
function applyRounding(
  value: number,
  method: "round" | "floor" | "ceil",
  decimals: number
): number {
  const multiplier = Math.pow(10, decimals)
  switch (method) {
    case "floor":
      return Math.floor(value * multiplier) / multiplier
    case "ceil":
      return Math.ceil(value * multiplier) / multiplier
    default:
      return Math.round(value * multiplier) / multiplier
  }
}

/**
 * Convert percentage to letter grade
 */
export function percentageToLetter(
  percentage: number,
  options: ConversionOptions = {}
): string {
  const boundaries = options.boundaries || DEFAULT_GRADE_BOUNDARIES
  const rounded = applyRounding(
    percentage,
    options.roundingMethod || "round",
    options.decimalPlaces ?? 2
  )

  const boundary = boundaries.find(
    (b) => rounded >= b.minScore && rounded <= b.maxScore
  )

  return boundary?.grade || "F"
}

/**
 * Convert percentage to GPA (4.0 scale)
 */
export function percentageToGPA4(
  percentage: number,
  options: ConversionOptions = {}
): number {
  const boundaries = options.boundaries || DEFAULT_GRADE_BOUNDARIES
  const rounded = applyRounding(
    percentage,
    options.roundingMethod || "round",
    options.decimalPlaces ?? 2
  )

  const boundary = boundaries.find(
    (b) => rounded >= b.minScore && rounded <= b.maxScore
  )

  return boundary?.gpa4 ?? 0.0
}

/**
 * Convert percentage to GPA (5.0 scale)
 */
export function percentageToGPA5(
  percentage: number,
  options: ConversionOptions = {}
): number {
  const boundaries = options.boundaries || DEFAULT_GRADE_BOUNDARIES
  const rounded = applyRounding(
    percentage,
    options.roundingMethod || "round",
    options.decimalPlaces ?? 2
  )

  const boundary = boundaries.find(
    (b) => rounded >= b.minScore && rounded <= b.maxScore
  )

  return boundary?.gpa5 ?? 0.0
}

/**
 * Convert GPA to letter grade
 */
export function gpaToLetter(gpa: number, scale: 4 | 5 = 4): string {
  const boundaries = DEFAULT_GRADE_BOUNDARIES

  const key = scale === 4 ? "gpa4" : "gpa5"
  // Find closest match (GPA boundaries are not ranges, so match closest)
  const sorted = [...boundaries].sort(
    (a, b) => Math.abs(a[key] - gpa) - Math.abs(b[key] - gpa)
  )

  return sorted[0]?.grade || "F"
}

/**
 * Convert GPA 4.0 to GPA 5.0
 */
export function gpa4ToGpa5(gpa4: number): number {
  // Linear conversion: GPA5 = GPA4 * (5/4) = GPA4 * 1.25
  return Math.min(5.0, gpa4 * 1.25)
}

/**
 * Convert GPA 5.0 to GPA 4.0
 */
export function gpa5ToGpa4(gpa5: number): number {
  // Linear conversion: GPA4 = GPA5 * (4/5) = GPA5 * 0.8
  return Math.min(4.0, gpa5 * 0.8)
}

/**
 * Convert letter grade to percentage (midpoint)
 */
export function letterToPercentage(
  letter: string,
  options: ConversionOptions = {}
): number {
  const boundaries = options.boundaries || DEFAULT_GRADE_BOUNDARIES
  const boundary = boundaries.find(
    (b) => b.grade.toLowerCase() === letter.toLowerCase()
  )

  if (!boundary) return 0

  // Return midpoint of the range
  return (boundary.minScore + boundary.maxScore) / 2
}

/**
 * Universal grade converter
 * Converts from one grading system to another
 */
export function convertGrade(
  value: number | string,
  from: GradingSystem,
  to: GradingSystem,
  options: ConversionOptions = {}
): { value: number | string; display: string } {
  // First, normalize to percentage
  let percentage: number

  if (typeof value === "string") {
    // It's a letter grade
    percentage = letterToPercentage(value, options)
  } else {
    // It's a numeric value
    switch (from) {
      case "PERCENTAGE":
        percentage = value
        break
      case "GPA_4":
        // Reverse lookup from GPA to percentage
        percentage = (value / 4.0) * 100
        break
      case "GPA_5":
        percentage = (value / 5.0) * 100
        break
      default:
        percentage = value
    }
  }

  // Then convert to target system
  switch (to) {
    case "PERCENTAGE":
      return {
        value: applyRounding(
          percentage,
          options.roundingMethod || "round",
          options.decimalPlaces ?? 2
        ),
        display: `${applyRounding(percentage, options.roundingMethod || "round", options.decimalPlaces ?? 2)}%`,
      }

    case "GPA_4":
      const gpa4 = percentageToGPA4(percentage, options)
      return {
        value: gpa4,
        display: gpa4.toFixed(2),
      }

    case "GPA_5":
      const gpa5 = percentageToGPA5(percentage, options)
      return {
        value: gpa5,
        display: gpa5.toFixed(2),
      }

    case "LETTER":
      const letter = percentageToLetter(percentage, options)
      return {
        value: letter,
        display: letter,
      }

    default:
      return {
        value: percentage,
        display: `${percentage}%`,
      }
  }
}

/**
 * Get all grade representations for a score
 */
export function getAllGradeFormats(
  percentage: number,
  options: ConversionOptions = {}
): {
  percentage: number
  gpa4: number
  gpa5: number
  letter: string
  passed: boolean
} {
  return {
    percentage: applyRounding(
      percentage,
      options.roundingMethod || "round",
      options.decimalPlaces ?? 2
    ),
    gpa4: percentageToGPA4(percentage, options),
    gpa5: percentageToGPA5(percentage, options),
    letter: percentageToLetter(percentage, options),
    passed: percentage >= 60, // Default passing threshold
  }
}

/**
 * Check if a grade is passing
 */
export function isPassing(
  value: number | string,
  system: GradingSystem,
  threshold?: number
): boolean {
  const defaultThresholds: Record<GradingSystem, number> = {
    PERCENTAGE: 60,
    GPA_4: 2.0,
    GPA_5: 2.5,
    LETTER: 60, // Converted to percentage
    CGPA: 2.0,
    CCE: 40,
    CBSE: 33,
    ICSE: 35,
  }

  const passingThreshold = threshold ?? defaultThresholds[system]

  if (typeof value === "string") {
    // Convert letter to percentage for comparison
    const percentage = letterToPercentage(value)
    return percentage >= (threshold ?? 60)
  }

  return value >= passingThreshold
}

/**
 * Format grade for display
 */
export function formatGrade(
  value: number | string,
  system: GradingSystem
): string {
  if (typeof value === "string") return value

  switch (system) {
    case "PERCENTAGE":
      return `${value.toFixed(1)}%`
    case "GPA_4":
      return value.toFixed(2)
    case "GPA_5":
      return value.toFixed(2)
    case "LETTER":
      return percentageToLetter(value)
    default:
      return value.toString()
  }
}
