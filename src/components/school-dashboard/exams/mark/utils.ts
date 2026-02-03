// Auto-Marking System Utility Functions

import type { DifficultyLevel, QuestionType } from "@prisma/client"

import { AI_CONFIDENCE, OCR_CONFIDENCE, QUESTION_TYPES } from "./config"
import type { ConfidenceIndicator, ConfidenceLevel } from "./types"

// ========== Score Calculation ==========

/**
 * Calculate percentage score
 */
export function calculatePercentage(
  pointsAwarded: number,
  maxPoints: number
): number {
  if (maxPoints === 0) return 0
  return Math.round((pointsAwarded / maxPoints) * 100 * 100) / 100 // Round to 2 decimals
}

/**
 * Calculate letter grade from percentage
 */
export function calculateLetterGrade(percentage: number): string {
  if (percentage >= 95) return "A+"
  if (percentage >= 90) return "A"
  if (percentage >= 85) return "B+"
  if (percentage >= 80) return "B"
  if (percentage >= 75) return "C+"
  if (percentage >= 70) return "C"
  if (percentage >= 65) return "D+"
  if (percentage >= 60) return "D"
  return "F"
}

/**
 * Check if score is passing
 */
export function isPassing(
  pointsAwarded: number,
  maxPoints: number,
  passingPercentage: number = 50
): boolean {
  const percentage = calculatePercentage(pointsAwarded, maxPoints)
  return percentage >= passingPercentage
}

// ========== Auto-Grading Logic ==========

/**
 * Check if answer matches accepted answer (case-insensitive by default)
 */
export function compareAnswers(
  studentAnswer: string,
  correctAnswer: string,
  caseSensitive: boolean = false
): boolean {
  const normalize = (str: string) => str.trim()
  const student = caseSensitive
    ? normalize(studentAnswer)
    : normalize(studentAnswer).toLowerCase()
  const correct = caseSensitive
    ? normalize(correctAnswer)
    : normalize(correctAnswer).toLowerCase()

  return student === correct
}

/**
 * Check if student answer matches any accepted answer
 */
export function matchesAnyAnswer(
  studentAnswer: string,
  acceptedAnswers: string[],
  caseSensitive: boolean = false
): boolean {
  return acceptedAnswers.some((accepted) =>
    compareAnswers(studentAnswer, accepted, caseSensitive)
  )
}

/**
 * Grade Multiple Choice Question
 */
export function gradeMCQ(
  selectedOptionIds: string[],
  correctOptionIds: string[],
  partialCredit: boolean = false
): { pointsAwarded: number; maxPoints: number; isCorrect: boolean } {
  const maxPoints = 1

  // Full match required if not partial credit
  if (!partialCredit) {
    const isCorrect =
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every((id) => correctOptionIds.includes(id))
    return {
      pointsAwarded: isCorrect ? maxPoints : 0,
      maxPoints,
      isCorrect,
    }
  }

  // Partial credit calculation
  const correctSelected = selectedOptionIds.filter((id) =>
    correctOptionIds.includes(id)
  ).length
  const incorrectSelected = selectedOptionIds.filter(
    (id) => !correctOptionIds.includes(id)
  ).length
  const totalCorrect = correctOptionIds.length

  // Points = (correct selections - incorrect selections) / total correct
  const score = Math.max(
    0,
    (correctSelected - incorrectSelected) / totalCorrect
  )
  const pointsAwarded = Math.round(score * maxPoints * 100) / 100

  return {
    pointsAwarded,
    maxPoints,
    isCorrect: pointsAwarded === maxPoints,
  }
}

/**
 * Grade True/False Question
 */
export function gradeTrueFalse(
  selectedAnswer: boolean,
  correctAnswer: boolean
): { pointsAwarded: number; maxPoints: number; isCorrect: boolean } {
  const maxPoints = 1
  const isCorrect = selectedAnswer === correctAnswer
  return {
    pointsAwarded: isCorrect ? maxPoints : 0,
    maxPoints,
    isCorrect,
  }
}

/**
 * Grade Fill in the Blank
 */
export function gradeFillBlank(
  studentAnswer: string,
  acceptedAnswers: string[],
  caseSensitive: boolean = false
): { pointsAwarded: number; maxPoints: number; isCorrect: boolean } {
  const maxPoints = 1
  const isCorrect = matchesAnyAnswer(
    studentAnswer,
    acceptedAnswers,
    caseSensitive
  )
  return {
    pointsAwarded: isCorrect ? maxPoints : 0,
    maxPoints,
    isCorrect,
  }
}

// ========== Confidence Indicators ==========

/**
 * Get OCR confidence level and indicator
 */
export function getOCRConfidenceIndicator(
  confidence: number
): ConfidenceIndicator {
  if (confidence >= OCR_CONFIDENCE.HIGH) {
    return {
      level: "high",
      value: confidence,
      message: "High confidence OCR extraction",
      color: "text-green-600",
    }
  } else if (confidence >= OCR_CONFIDENCE.MEDIUM) {
    return {
      level: "medium",
      value: confidence,
      message: "Medium confidence - review recommended",
      color: "text-yellow-600",
    }
  } else if (confidence >= OCR_CONFIDENCE.LOW) {
    return {
      level: "low",
      value: confidence,
      message: "Low confidence - manual review required",
      color: "text-orange-600",
    }
  } else {
    return {
      level: "poor",
      value: confidence,
      message: "Poor OCR quality - manual entry recommended",
      color: "text-red-600",
    }
  }
}

/**
 * Get AI grading confidence level and indicator
 */
export function getAIConfidenceIndicator(
  confidence: number
): ConfidenceIndicator {
  if (confidence >= AI_CONFIDENCE.HIGH) {
    return {
      level: "high",
      value: confidence,
      message: "High confidence AI grading",
      color: "text-green-600",
    }
  } else if (confidence >= AI_CONFIDENCE.MEDIUM) {
    return {
      level: "medium",
      value: confidence,
      message: "Medium confidence - review suggested",
      color: "text-yellow-600",
    }
  } else if (confidence >= AI_CONFIDENCE.LOW) {
    return {
      level: "low",
      value: confidence,
      message: "Low confidence - review required",
      color: "text-orange-600",
    }
  } else {
    return {
      level: "poor",
      value: confidence,
      message: "Very low confidence - manual grading recommended",
      color: "text-red-600",
    }
  }
}

// ========== Question Analysis ==========

/**
 * Check if question type is auto-gradable
 */
export function isAutoGradable(questionType: QuestionType): boolean {
  return QUESTION_TYPES[questionType]?.autoGradable ?? false
}

/**
 * Get estimated grading time based on question type
 */
export function getEstimatedGradingTime(questionType: QuestionType): number {
  // Time in minutes
  const gradingTimes: Record<QuestionType, number> = {
    MULTIPLE_CHOICE: 0.5,
    TRUE_FALSE: 0.5,
    FILL_BLANK: 1,
    SHORT_ANSWER: 2,
    ESSAY: 5,
  }

  return gradingTimes[questionType] ?? 2
}

/**
 * Calculate total estimated time for exam grading
 */
export function calculateTotalGradingTime(
  questionTypes: QuestionType[]
): number {
  return questionTypes.reduce(
    (total, type) => total + getEstimatedGradingTime(type),
    0
  )
}

// ========== Formatting Utilities ==========

/**
 * Format points display (e.g., "8.5/10")
 */
export function formatPoints(pointsAwarded: number, maxPoints: number): string {
  return `${pointsAwarded}/${maxPoints}`
}

/**
 * Format percentage display (e.g., "85%")
 */
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`
}

/**
 * Format confidence value (e.g., "92%")
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

/**
 * Format time duration (e.g., "2h 30m" or "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// ========== Statistical Utilities ==========

/**
 * Calculate average score
 */
export function calculateAverage(scores: number[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, score) => acc + score, 0)
  return Math.round((sum / scores.length) * 100) / 100
}

/**
 * Calculate median score
 */
export function calculateMedian(scores: number[]): number {
  if (scores.length === 0) return 0
  const sorted = [...scores].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(scores: number[]): number {
  if (scores.length === 0) return 0
  const avg = calculateAverage(scores)
  const squareDiffs = scores.map((score) => Math.pow(score - avg, 2))
  const avgSquareDiff = calculateAverage(squareDiffs)
  return Math.round(Math.sqrt(avgSquareDiff) * 100) / 100
}

/**
 * Get grade distribution
 */
export function getGradeDistribution(
  percentages: number[]
): Record<string, number> {
  const distribution: Record<string, number> = {
    "A+": 0,
    A: 0,
    "B+": 0,
    B: 0,
    "C+": 0,
    C: 0,
    "D+": 0,
    D: 0,
    F: 0,
  }

  percentages.forEach((percentage) => {
    const grade = calculateLetterGrade(percentage)
    distribution[grade]++
  })

  return distribution
}

// ========== Validation Utilities ==========

/**
 * Validate file type for upload
 */
export function isValidFileType(file: File): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]
  return allowedTypes.includes(file.type)
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxBytes
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

// ========== JSON Parsing Utilities ==========

/**
 * Safely parse JSON options from QuestionBank
 */
export function parseQuestionOptions(
  options: unknown
): Array<{ text: string; isCorrect: boolean; explanation?: string }> {
  try {
    if (Array.isArray(options)) {
      return options as Array<{
        text: string
        isCorrect: boolean
        explanation?: string
      }>
    }
    return []
  } catch {
    return []
  }
}

/**
 * Safely parse accepted answers from QuestionBank
 */
export function parseAcceptedAnswers(acceptedAnswers: unknown): string[] {
  try {
    if (Array.isArray(acceptedAnswers)) {
      return acceptedAnswers as string[]
    }
    return []
  } catch {
    return []
  }
}
