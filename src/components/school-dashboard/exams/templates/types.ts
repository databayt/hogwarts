// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Paper Templates - Shared Type Definitions
 * Types for the reusable atom → section → template hierarchy
 */

import type {
  BloomLevel,
  DifficultyLevel,
  ExamPaperConfig,
  ExamPaperTemplate,
  QuestionType,
  SchoolBranding,
} from "@prisma/client"

// ============================================================================
// PAPER THEME
// ============================================================================

/** The single theming contract passed to every atom and section */
export type PaperTheme = {
  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  mutedColor: string
  surfaceColor: string

  // Typography
  fontFamily: string
  fontSize: {
    title: number
    subtitle: number
    heading: number
    body: number
    small: number
    tiny: number
  }

  // Spacing
  questionGap: number
  sectionGap: number
  optionGap: number
  pageMargin: number

  // Locale
  locale: "en" | "ar"
  isRTL: boolean

  // Variants
  numberStyle: "plain" | "circle" | "square"
  borderStyle: "solid" | "dashed" | "double"
}

// ============================================================================
// QUESTION TYPES
// ============================================================================

export type { QuestionType, DifficultyLevel, BloomLevel }

/** MCQ/True-False option */
export interface QuestionOption {
  text: string
  isCorrect: boolean
  explanation?: string
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
  acceptedAnswers?: string[]
  sampleAnswer?: string | null
  gradingRubric?: string | null
  explanation?: string | null
}

// ============================================================================
// EXAM & SCHOOL DATA
// ============================================================================

/** Exam with class and subject info */
export interface ExamWithDetails {
  id: string
  title: string
  examDate: Date
  startTime?: string | null
  duration: number
  totalMarks: number
  class: { name: string; id: string }
  subject: { subjectName: string; id: string }
}

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

/** Paper generation metadata */
export interface PaperMetadata {
  locale: "en" | "ar"
  generatedAt: Date
  generatedBy: string
  version?: string
  versionCode?: string
  totalPages: number
  totalMarks: number
  totalQuestions: number
  duration: number
}

/** Complete data for paper PDF generation */
export interface ExamPaperData {
  exam: ExamWithDetails
  school: SchoolForPaper
  questions: QuestionForPaper[]
  config: ExamPaperConfig
  metadata: PaperMetadata
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export type { ExamPaperTemplate }

export interface TemplateEntry {
  component: React.ComponentType<{ data: ExamPaperData }>
  name: string
  description: string
}

// ============================================================================
// QUESTION SECTION COMMON PROPS
// ============================================================================

/** Props shared by all question section components */
export interface QuestionSectionProps {
  question: QuestionForPaper
  theme: PaperTheme
  showNumber: boolean
  showPoints: boolean
  showType: boolean
}

/** Props for question sections with answer lines */
export interface QuestionWithLinesProps extends QuestionSectionProps {
  answerLines: number
}

// ============================================================================
// HEADER / FOOTER SECTION PROPS
// ============================================================================

export interface HeaderSectionProps {
  school: SchoolForPaper
  exam: ExamWithDetails
  theme: PaperTheme
  showLogo: boolean
  showTitle: boolean
  versionCode?: string
  logoSize?: number
}

export interface FooterSectionProps {
  theme: PaperTheme
  showTotal: boolean
  customText?: string
  versionCode?: string
}

export interface StudentInfoSectionProps {
  theme: PaperTheme
  showName?: boolean
  showId?: boolean
  showClass?: boolean
  showDate?: boolean
  showSeatNumber?: boolean
}

export interface InstructionsSectionProps {
  theme: PaperTheme
  totalMarks: number
  totalQuestions: number
  duration: number
  customInstructions?: string
}
