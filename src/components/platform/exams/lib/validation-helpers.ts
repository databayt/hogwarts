/**
 * Exam Validation Helpers
 *
 * Additional validation utilities for exam-related operations including:
 * - Question points sum validation
 * - Certificate date validation
 * - Answer key completeness
 * - OCR confidence thresholds
 */

import { z } from "zod"

/**
 * Validate that question points sum matches exam total marks
 */
export function validateQuestionPointsSum(
  questions: Array<{ points: number }>,
  expectedTotal: number,
  tolerance: number = 0
): {
  valid: boolean
  actualSum: number
  difference: number
  message?: string
} {
  const actualSum = questions.reduce((sum, q) => sum + q.points, 0)
  const difference = Math.abs(actualSum - expectedTotal)

  if (difference <= tolerance) {
    return { valid: true, actualSum, difference }
  }

  return {
    valid: false,
    actualSum,
    difference,
    message: `Question points sum (${actualSum}) does not match exam total marks (${expectedTotal}). Difference: ${difference}`,
  }
}

/**
 * Validate certificate expiry date
 */
export function validateCertificateExpiry(
  issueDate: Date,
  expiryDate: Date | null
): {
  valid: boolean
  message?: string
} {
  if (!expiryDate) {
    return { valid: true } // No expiry is valid
  }

  if (expiryDate <= issueDate) {
    return {
      valid: false,
      message: "Certificate expiry date must be after issue date",
    }
  }

  // Expiry should be at least 1 day after issue
  const oneDayAfter = new Date(issueDate)
  oneDayAfter.setDate(oneDayAfter.getDate() + 1)

  if (expiryDate < oneDayAfter) {
    return {
      valid: false,
      message: "Certificate expiry must be at least 1 day after issue date",
    }
  }

  // Expiry should not be more than 10 years from issue
  const tenYearsAfter = new Date(issueDate)
  tenYearsAfter.setFullYear(tenYearsAfter.getFullYear() + 10)

  if (expiryDate > tenYearsAfter) {
    return {
      valid: false,
      message:
        "Certificate expiry cannot be more than 10 years from issue date",
    }
  }

  return { valid: true }
}

/**
 * Validate answer key completeness for an exam
 */
export function validateAnswerKeyCompleteness(
  questions: Array<{
    id: string
    questionType: string
    options?: Array<{ isCorrect?: boolean }>
    sampleAnswer?: string
    acceptedAnswers?: string[]
  }>
): {
  valid: boolean
  missingAnswers: string[]
  message?: string
} {
  const missingAnswers: string[] = []

  for (const question of questions) {
    switch (question.questionType) {
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE":
        // Must have at least one correct option
        const hasCorrectOption = question.options?.some((o) => o.isCorrect)
        if (!hasCorrectOption) {
          missingAnswers.push(question.id)
        }
        break

      case "FILL_BLANK":
        // Must have at least one accepted answer
        if (
          !question.acceptedAnswers ||
          question.acceptedAnswers.length === 0 ||
          question.acceptedAnswers.every((a) => !a.trim())
        ) {
          missingAnswers.push(question.id)
        }
        break

      case "SHORT_ANSWER":
      case "ESSAY":
        // Sample answer is recommended but not required
        // Only flag if both sample answer and accepted answers are missing
        if (
          !question.sampleAnswer?.trim() &&
          (!question.acceptedAnswers || question.acceptedAnswers.length === 0)
        ) {
          // This is a warning, not an error for subjective questions
          // missingAnswers.push(question.id)
        }
        break
    }
  }

  if (missingAnswers.length > 0) {
    return {
      valid: false,
      missingAnswers,
      message: `${missingAnswers.length} question(s) are missing correct answers`,
    }
  }

  return { valid: true, missingAnswers: [] }
}

/**
 * OCR confidence threshold validation
 */
export const OCR_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9, // Auto-accept
  MEDIUM: 0.7, // Review recommended
  LOW: 0.5, // Manual verification required
  REJECT: 0.3, // Below this, reject OCR result
} as const

export function validateOCRConfidence(confidence: number): {
  level: "HIGH" | "MEDIUM" | "LOW" | "REJECT"
  autoAccept: boolean
  requiresReview: boolean
  message: string
} {
  if (confidence >= OCR_CONFIDENCE_THRESHOLDS.HIGH) {
    return {
      level: "HIGH",
      autoAccept: true,
      requiresReview: false,
      message: "OCR result is highly confident",
    }
  }

  if (confidence >= OCR_CONFIDENCE_THRESHOLDS.MEDIUM) {
    return {
      level: "MEDIUM",
      autoAccept: false,
      requiresReview: true,
      message: "OCR result should be reviewed",
    }
  }

  if (confidence >= OCR_CONFIDENCE_THRESHOLDS.LOW) {
    return {
      level: "LOW",
      autoAccept: false,
      requiresReview: true,
      message: "OCR result requires manual verification",
    }
  }

  return {
    level: "REJECT",
    autoAccept: false,
    requiresReview: true,
    message: "OCR confidence too low, manual entry recommended",
  }
}

/**
 * Zod schema for certificate configuration
 */
export const certificateConfigSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    type: z.enum(["EXAM_RESULT", "COURSE_COMPLETION", "ACHIEVEMENT"]),
    template: z.string().min(1, "Template is required"),
    issueDate: z.date().optional(),
    expiryDate: z.date().optional().nullable(),
    includeGrade: z.boolean().default(true),
    includeRank: z.boolean().default(false),
    includeQRCode: z.boolean().default(true),
    minPassScore: z.number().min(0).max(100).optional(),
  })
  .superRefine((val, ctx) => {
    // Validate expiry date if provided
    if (val.expiryDate && val.issueDate) {
      const validation = validateCertificateExpiry(
        val.issueDate,
        val.expiryDate
      )
      if (!validation.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.message!,
          path: ["expiryDate"],
        })
      }
    }
  })

/**
 * Zod schema for generated exam validation
 */
export const generatedExamValidationSchema = z
  .object({
    examId: z.string().min(1),
    questions: z.array(
      z.object({
        id: z.string(),
        points: z.number().positive(),
      })
    ),
    totalMarks: z.number().positive(),
    allowPointsMismatch: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (!val.allowPointsMismatch) {
      const validation = validateQuestionPointsSum(
        val.questions,
        val.totalMarks
      )
      if (!validation.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.message!,
          path: ["questions"],
        })
      }
    }
  })

/**
 * Validate exam time slot conflicts
 */
export function validateTimeSlotConflict(
  newExam: { date: Date; startTime: string; endTime: string; classId: string },
  existingExams: Array<{
    date: Date
    startTime: string
    endTime: string
    classId: string
    title: string
  }>
): {
  hasConflict: boolean
  conflicts: Array<{ title: string; time: string }>
} {
  const conflicts: Array<{ title: string; time: string }> = []

  for (const existing of existingExams) {
    // Check if same class and same date
    if (
      existing.classId !== newExam.classId ||
      existing.date.toDateString() !== newExam.date.toDateString()
    ) {
      continue
    }

    // Parse times
    const newStart = parseTime(newExam.startTime)
    const newEnd = parseTime(newExam.endTime)
    const existingStart = parseTime(existing.startTime)
    const existingEnd = parseTime(existing.endTime)

    // Check for overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      conflicts.push({
        title: existing.title,
        time: `${existing.startTime} - ${existing.endTime}`,
      })
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  }
}

/**
 * Parse time string to minutes since midnight
 */
function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Validate marking completion
 */
export function validateMarkingCompletion(
  totalStudents: number,
  markedStudents: number,
  unmarkedQuestions: Array<{ studentId: string; questionId: string }>
): {
  complete: boolean
  completionRate: number
  unmarkedCount: number
  message: string
} {
  const completionRate =
    totalStudents > 0 ? (markedStudents / totalStudents) * 100 : 0

  if (unmarkedQuestions.length === 0 && markedStudents === totalStudents) {
    return {
      complete: true,
      completionRate: 100,
      unmarkedCount: 0,
      message: "All students have been marked",
    }
  }

  return {
    complete: false,
    completionRate: Math.round(completionRate * 100) / 100,
    unmarkedCount: unmarkedQuestions.length,
    message: `${unmarkedQuestions.length} question(s) still need marking`,
  }
}
