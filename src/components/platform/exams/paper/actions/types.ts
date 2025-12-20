/**
 * Paper Generation Actions - Type Definitions
 */

import type { ExamPaperConfig, GeneratedPaper } from "@prisma/client"

import type {
  AnswerKeyEntry,
  ExamWithDetails,
  GeneratedExamWithDetails,
  QuestionForPaper,
  SchoolForPaper,
} from "../types"

// ============================================================================
// ACTION RESPONSE TYPES
// ============================================================================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// ============================================================================
// PAPER CONFIG ACTION TYPES
// ============================================================================

export interface CreatePaperConfigInput {
  generatedExamId: string
  template?: "CLASSIC" | "MODERN" | "FORMAL" | "CUSTOM"
  layout?: "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET"
  answerSheetType?: "NONE" | "SEPARATE" | "BUBBLE"
  showSchoolLogo?: boolean
  showExamTitle?: boolean
  showInstructions?: boolean
  customInstructions?: string
  showStudentInfo?: boolean
  showQuestionNumbers?: boolean
  showPointsPerQuestion?: boolean
  showQuestionType?: boolean
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  answerLinesShort?: number
  answerLinesEssay?: number
  showPageNumbers?: boolean
  showTotalPages?: boolean
  customFooter?: string
  pageSize?: "A4" | "Letter"
  orientation?: "portrait" | "landscape"
  versionCount?: number
}

export interface UpdatePaperConfigInput {
  configId: string
  template?: "CLASSIC" | "MODERN" | "FORMAL" | "CUSTOM"
  layout?: "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET"
  answerSheetType?: "NONE" | "SEPARATE" | "BUBBLE"
  showSchoolLogo?: boolean
  showExamTitle?: boolean
  showInstructions?: boolean
  customInstructions?: string | null
  showStudentInfo?: boolean
  showQuestionNumbers?: boolean
  showPointsPerQuestion?: boolean
  showQuestionType?: boolean
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  answerLinesShort?: number
  answerLinesEssay?: number
  showPageNumbers?: boolean
  showTotalPages?: boolean
  customFooter?: string | null
  pageSize?: "A4" | "Letter"
  orientation?: "portrait" | "landscape"
  versionCount?: number
}

// ============================================================================
// PAPER GENERATION ACTION TYPES
// ============================================================================

export interface GeneratePaperInput {
  generatedExamId: string
  configId?: string
  versionCode?: string
}

export interface GeneratePaperOutput {
  paperId: string
  pdfUrl?: string
  versionCode?: string
  questionCount: number
}

export interface GenerateAnswerKeyInput {
  generatedExamId: string
}

export interface GenerateAnswerKeyOutput {
  answerKeyId: string
  pdfUrl?: string
  answers: AnswerKeyEntry[]
}

export interface GenerateVersionsInput {
  generatedExamId: string
  versionCount: number
}

export interface GenerateVersionsOutput {
  papers: GeneratePaperOutput[]
  answerKeyId: string
}

// ============================================================================
// DATA FETCHING TYPES
// ============================================================================

export interface PaperConfigWithRelations extends ExamPaperConfig {
  generatedExam: GeneratedExamWithDetails
  papers: GeneratedPaper[]
}

export interface ExamPaperDataBundle {
  exam: ExamWithDetails
  school: SchoolForPaper
  questions: QuestionForPaper[]
  config: ExamPaperConfig
  generatedExam: GeneratedExamWithDetails
}
