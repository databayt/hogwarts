/**
 * Shared types for qbank action modules
 * Implements standardized ActionResponse pattern
 */

import type {
  BloomLevel,
  DifficultyLevel,
  ExamTemplate,
  GeneratedExam,
  QuestionAnalytics,
  QuestionBank,
  QuestionType,
  Subject,
} from "@prisma/client"

/**
 * Standardized response type for all server actions
 * Ensures consistent error handling across the platform
 */
export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string; details?: unknown }

// Question Bank types
export interface QuestionWithAnalytics extends QuestionBank {
  analytics?: QuestionAnalytics | null
  subject?: Pick<Subject, "id" | "subjectName"> | null
  _count?: {
    generatedExamQuestions: number
  }
}

export interface CreateQuestionData {
  subjectId: string
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  timeEstimate?: number
  options?: any
  tags?: string[]
  sampleAnswer?: string
  acceptedAnswers?: any
  explanation?: string
  imageUrl?: string
}

// Template types
export interface TemplateWithStats extends ExamTemplate {
  subject?: Pick<Subject, "id" | "subjectName"> | null
  _count?: {
    generatedExams: number
  }
}

export interface CreateTemplateData {
  name: string
  description?: string
  subjectId: string
  distribution: Record<string, Record<string, number>>
  bloomDistribution?: Record<string, number>
  totalQuestions: number
  totalMarks: number
  isActive?: boolean
}

// Generation types
export interface GenerateExamData {
  examId: string
  templateId?: string
  customDistribution?: Record<string, Record<string, number>>
  isRandomized?: boolean
  seed?: string
  generationNotes?: string
  questionIds?: string[]
}

export interface GenerationResult {
  generatedExamId: string
  totalQuestions: number
  metadata?: {
    distributionMet: boolean
    missingCategories: string[]
  }
}

// Analytics types
export interface AnalyticsUpdate {
  questionId: string
  score: number
  maxPoints: number
  timeSpent?: number
}

export interface DashboardAnalytics {
  totalQuestions: number
  totalTemplates: number
  totalGeneratedExams: number
  questions: QuestionWithAnalytics[]
  subjectBreakdown?: Record<string, number>
  difficultyBreakdown?: Record<DifficultyLevel, number>
  typeBreakdown?: Record<QuestionType, number>
}

// Filter types
export interface QuestionFilters {
  subjectId?: string
  questionType?: QuestionType
  difficulty?: DifficultyLevel
  bloomLevel?: BloomLevel
  search?: string
  tags?: string[]
  isActive?: boolean
}

export interface TemplateFilters {
  subjectId?: string
  isActive?: boolean
  search?: string
}

// Import/Export types
export interface ImportResult {
  imported: number
  failed: number
  errors: Array<{
    row: number
    error: string
  }>
}

export interface ExportOptions {
  format: "csv" | "json" | "excel"
  includeAnalytics?: boolean
  filters?: QuestionFilters
}
