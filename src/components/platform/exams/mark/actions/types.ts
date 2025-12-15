/**
 * Shared types for mark action modules
 * Implements standardized ActionResponse pattern
 */

import type {
  GradingMethod,
  MarkingResult,
  MarkingStatus,
  QuestionBank,
  QuestionType,
  Rubric,
  RubricCriterion,
  StudentAnswer,
} from "@prisma/client"

/**
 * Standardized response type for all server actions
 * Ensures consistent error handling across the platform
 */
export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string; details?: unknown }

// Question Bank types
export interface QuestionWithRubrics extends QuestionBank {
  rubrics: Array<
    Rubric & {
      criteria: RubricCriterion[]
    }
  >
}

export interface QuestionOption {
  text: string
  isCorrect: boolean
  id?: string
}

// Student Answer types
export interface StudentAnswerWithDetails extends StudentAnswer {
  question: QuestionWithRubrics
  markingResult?: MarkingResult | null
}

// Marking types
export interface AutoGradeResult {
  pointsAwarded: number
  maxPoints: number
  isCorrect: boolean
  confidence?: number
}

export interface AIGradeResult {
  success: boolean
  aiScore: number
  aiConfidence: number
  aiReasoning: string
  suggestedFeedback?: string
  needsReview: boolean
  error?: string
}

export interface OCRResult {
  success: boolean
  extractedText?: string
  confidence?: number
  error?: string
}

// Bulk operations
export interface BulkGradeResult {
  graded: number
  failed: number
  total: number
  errors?: Array<{
    answerId: string
    error: string
  }>
}

// Form input types
export interface CreateQuestionInput {
  subjectId: string
  questionText: string
  questionType: QuestionType
  difficulty: string
  bloomLevel: string
  points: number
  timeEstimate?: number
  options?: QuestionOption[] | string
  sampleAnswer?: string
  tags?: string[]
  explanation?: string
  imageUrl?: string
}

export interface CreateRubricInput {
  questionId: string
  title: string
  description?: string
  criteria: Array<{
    criterion: string
    description?: string
    maxPoints: number
    order: number
  }>
}

export interface SubmitAnswerInput {
  examId: string
  questionId: string
  submissionType: string
  answerText?: string
  selectedOptionIds?: string[]
  uploadUrl?: string
}

export interface GradeOverrideInput {
  markingResultId: string
  newScore: number
  reason: string
}

export interface BulkGradeInput {
  examId: string
  studentIds?: string[]
  questionIds?: string[]
  autoGradeOnly?: boolean
}

// Utility type for tenant context
export interface TenantContext {
  schoolId: string
  userId: string
}
