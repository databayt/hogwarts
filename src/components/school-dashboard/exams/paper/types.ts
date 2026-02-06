/**
 * Exam Paper System - Type Definitions
 * Types for exam paper generation, configuration, and PDF output
 */

import type {
  AnswerSheetType,
  BloomLevel,
  DifficultyLevel,
  Exam,
  ExamPaperConfig,
  ExamPaperTemplate,
  GeneratedExam,
  GeneratedExamQuestion,
  GeneratedPaper,
  PaperLayout,
  QuestionBank,
  QuestionType,
  School,
  SchoolBranding,
  Subject,
} from "@prisma/client"

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export type { ExamPaperTemplate, PaperLayout, AnswerSheetType }

/** Paper configuration form data */
export interface PaperConfigFormData {
  template: ExamPaperTemplate
  layout: PaperLayout
  answerSheetType: AnswerSheetType

  // Header
  showSchoolLogo: boolean
  showExamTitle: boolean
  showInstructions: boolean
  customInstructions?: string
  showStudentInfo: boolean

  // Questions
  showQuestionNumbers: boolean
  showPointsPerQuestion: boolean
  showQuestionType: boolean
  shuffleQuestions: boolean
  shuffleOptions: boolean

  // Answer Space
  answerLinesShort: number
  answerLinesEssay: number

  // Footer & Print
  showPageNumbers: boolean
  showTotalPages: boolean
  customFooter?: string
  pageSize: "A4" | "Letter"
  orientation: "portrait" | "landscape"

  // Versioning
  versionCount: number
}

/** Full paper config with relations */
export interface PaperConfigDTO extends ExamPaperConfig {
  generatedExam: GeneratedExamWithDetails
  papers: GeneratedPaper[]
}

// ============================================================================
// EXAM & QUESTION TYPES
// ============================================================================

/** Generated exam with full relations */
export interface GeneratedExamWithDetails extends GeneratedExam {
  exam: ExamWithDetails
  questions: GeneratedExamQuestionWithQuestion[]
}

/** Exam with class and subject */
export interface ExamWithDetails extends Exam {
  class: { name: string; id: string }
  subject: { subjectName: string; id: string }
}

/** Generated question with full question data */
export interface GeneratedExamQuestionWithQuestion extends GeneratedExamQuestion {
  question: QuestionBank
}

/** Question formatted for paper rendering */
export interface QuestionForPaper {
  id: string
  order: number
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  timeEstimate?: number | null
  imageUrl?: string | null
  options?: QuestionOption[]
  acceptedAnswers?: string[] // For fill-blank
  sampleAnswer?: string | null
  gradingRubric?: string | null
  explanation?: string | null
}

/** MCQ/True-False option structure */
export interface QuestionOption {
  text: string
  isCorrect: boolean
  explanation?: string
}

/** Fill-blank options structure */
export interface FillBlankOptions {
  acceptedAnswers: string[]
  caseSensitive?: boolean
}

// ============================================================================
// PDF DATA TYPES
// ============================================================================

/** School data for paper header */
export interface SchoolForPaper {
  id: string
  name: string
  preferredLanguage?: string
  logoUrl?: string | null
  address?: string | null
  phoneNumber?: string | null
  email?: string | null
  branding?: SchoolBranding | null
}

/** Complete data for paper PDF generation */
export interface ExamPaperData {
  exam: ExamWithDetails
  school: SchoolForPaper
  questions: QuestionForPaper[]
  config: ExamPaperConfig
  metadata: PaperMetadata
}

/** Paper generation metadata */
export interface PaperMetadata {
  locale: "en" | "ar"
  generatedAt: Date
  generatedBy: string
  version?: string
  versionCode?: string // A, B, C
  totalPages: number
  totalMarks: number
  totalQuestions: number
  duration: number // minutes
}

// ============================================================================
// ANSWER KEY TYPES
// ============================================================================

/** Single answer key entry */
export interface AnswerKeyEntry {
  questionId: string
  order: number
  questionType: QuestionType
  questionText: string
  correctAnswer: string | string[]
  points: number
  explanation?: string | null
}

/** Complete answer key data */
export interface AnswerKeyData {
  exam: ExamWithDetails
  answers: AnswerKeyEntry[]
  metadata: {
    locale: "en" | "ar"
    generatedAt: Date
    generatedBy: string
    totalMarks: number
  }
}

// ============================================================================
// ACTION TYPES
// ============================================================================

/** Standard action response */
export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string; details?: unknown }

/** Paper generation result */
export interface GeneratePaperResult {
  paperId: string
  pdfUrl?: string
  pdfBlob?: Blob
  versionCode?: string
}

/** Answer key generation result */
export interface GenerateAnswerKeyResult {
  answerKeyId: string
  pdfUrl?: string
  pdfBlob?: Blob
  answers: AnswerKeyEntry[]
}

/** Multiple versions generation result */
export interface GenerateVersionsResult {
  papers: GeneratePaperResult[]
  answerKeys: GenerateAnswerKeyResult[]
}

// ============================================================================
// UI TYPES
// ============================================================================

/** Paper preview state */
export interface PaperPreviewState {
  isLoading: boolean
  pdfBlob?: Blob
  pdfUrl?: string
  error?: string
}

/** Paper config form state */
export interface PaperConfigFormState {
  isLoading: boolean
  isSaving: boolean
  isGenerating: boolean
  error?: string
  config?: ExamPaperConfig
}

/** Paper list row for table display */
export interface PaperRow {
  id: string
  versionCode?: string
  pdfUrl?: string
  answerKeyUrl?: string
  generatedBy: string
  generatedAt: Date
  questionCount: number
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/** Available paper template styles */
export const PAPER_TEMPLATES: Record<
  ExamPaperTemplate,
  { label: string; description: string }
> = {
  CLASSIC: {
    label: "كلاسيكي أكاديمي",
    description: "تنسيق الاختبار التقليدي مع رأس المدرسة والأسئلة المرقمة",
  },
  MODERN: {
    label: "حديث بسيط",
    description: "تخطيط نظيف وواسع مع زخارف قليلة",
  },
  FORMAL: {
    label: "رسمي",
    description: "نمط الاختبار الحكومي مع تنسيق صارم وعلامات مائية",
  },
  CUSTOM: {
    label: "مخصص",
    description: "يستخدم ألوان العلامة التجارية للمدرسة والتنسيق المخصص",
  },
}

/** Answer sheet type options */
export const ANSWER_SHEET_TYPES: Record<
  AnswerSheetType,
  { label: string; description: string }
> = {
  NONE: {
    label: "الإجابات مباشرة",
    description: "يكتب الطلاب الإجابات أسفل كل سؤال",
  },
  SEPARATE: {
    label: "ورقة منفصلة",
    description: "ورقة إجابة مخصصة في نهاية الاختبار",
  },
  BUBBLE: {
    label: "ورقة الفقاعات",
    description: "ورقة فقاعات للمسح الضوئي (اختيار متعدد فقط)",
  },
}

/** Paper layout options */
export const PAPER_LAYOUTS: Record<
  PaperLayout,
  { label: string; description: string }
> = {
  SINGLE_COLUMN: {
    label: "عمود واحد",
    description: "الأسئلة مرتبة عموديًا في عمود واحد",
  },
  TWO_COLUMN: {
    label: "عمودان",
    description: "الأسئلة مرتبة في عمودين (موفر للمساحة)",
  },
  BOOKLET: {
    label: "كتيب",
    description: "كتيب متعدد الصفحات مع ورقة الإجابة في النهاية",
  },
}
