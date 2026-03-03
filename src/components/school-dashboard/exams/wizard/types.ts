// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface StepDefinition {
  id: string
  label: { en: string; ar: string }
  isComplete: (state: TemplateWizardState) => boolean
}

export interface GradeBoundary {
  label: string
  minPercent: number
}

export interface DecorationConfig {
  accentBar: {
    enabled: boolean
    height?: number
    colorKey?: "accent" | "primary"
  }
  watermark: { enabled: boolean; text?: string; opacity?: number }
  frame: { enabled: boolean }
}

export interface TemplateWizardState {
  // Step 1: Gallery
  selectedPresetId: string | null

  // Step 2: Info
  name: string
  description: string
  subjectIds: string[]
  gradeIds: string[]
  duration: number
  totalMarks: number
  examType: ExamType
  questionTypes: QuestionTypeConfig[]

  // Step 3: Paper Layout (section variant selections)
  headerVariant: string
  footerVariant: string
  studentInfoVariant: string
  instructionsVariant: string
  answerSheetVariant: string
  coverVariant: string

  // Step N-2: Scoring & Grades
  passingScore: number
  gradeBoundaries: GradeBoundary[]

  // Step N-1: Footer & Print
  decorations: DecorationConfig
  pageSize: "A4" | "LETTER"
  orientation: "portrait" | "landscape"
  answerSheetType: "NONE" | "SEPARATE" | "BUBBLE"
  layout: "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET"

  // Navigation
  currentStep: number

  // Edit mode
  existingTemplateId: string | null
}

export type ExamType =
  | "MIDTERM"
  | "FINAL"
  | "QUIZ"
  | "POP_QUIZ"
  | "MOCK"
  | "PRACTICE"

export interface QuestionTypeConfig {
  type: QuestionTypeName
  count: number
  difficulty: DifficultyDistribution
}

export type QuestionTypeName =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "FILL_BLANK"
  | "MATCHING"
  | "ORDERING"

export interface DifficultyDistribution {
  EASY: number
  MEDIUM: number
  HARD: number
}

export type WizardAction =
  | { type: "SET_INFO"; payload: Partial<TemplateWizardState> }
  | { type: "SET_HEADER_VARIANT"; payload: string }
  | { type: "SET_FOOTER_VARIANT"; payload: string }
  | { type: "SET_STUDENT_INFO_VARIANT"; payload: string }
  | { type: "SET_INSTRUCTIONS_VARIANT"; payload: string }
  | { type: "SET_ANSWER_SHEET_VARIANT"; payload: string }
  | { type: "SET_COVER_VARIANT"; payload: string }
  | { type: "SET_QUESTION_TYPES"; payload: QuestionTypeConfig[] }
  | { type: "SET_PRESET"; payload: string | null }
  | {
      type: "APPLY_PRESET"
      payload: {
        slots: Record<string, string>
        decorations: DecorationConfig
      }
    }
  | { type: "SET_DECORATIONS"; payload: DecorationConfig }
  | {
      type: "SET_PRINT_CONFIG"
      payload: Partial<
        Pick<
          TemplateWizardState,
          "pageSize" | "orientation" | "answerSheetType" | "layout"
        >
      >
    }
  | {
      type: "SET_SCORING"
      payload: Partial<
        Pick<TemplateWizardState, "passingScore" | "gradeBoundaries">
      >
    }
  | { type: "SET_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "LOAD_STATE"; payload: TemplateWizardState }

export const DEFAULT_GRADE_BOUNDARIES: GradeBoundary[] = [
  { label: "A+", minPercent: 95 },
  { label: "A", minPercent: 90 },
  { label: "B+", minPercent: 85 },
  { label: "B", minPercent: 80 },
  { label: "C+", minPercent: 75 },
  { label: "C", minPercent: 70 },
  { label: "D", minPercent: 60 },
  { label: "F", minPercent: 0 },
]

export const DEFAULT_DECORATIONS: DecorationConfig = {
  accentBar: { enabled: false },
  watermark: { enabled: false },
  frame: { enabled: false },
}

export const INITIAL_STATE: TemplateWizardState = {
  selectedPresetId: null,
  name: "",
  description: "",
  subjectIds: [],
  gradeIds: [],
  duration: 60,
  totalMarks: 100,
  examType: "MIDTERM",
  questionTypes: [],
  headerVariant: "standard",
  footerVariant: "standard",
  studentInfoVariant: "standard",
  instructionsVariant: "standard",
  answerSheetVariant: "standard",
  coverVariant: "standard",
  passingScore: 50,
  gradeBoundaries: DEFAULT_GRADE_BOUNDARIES,
  decorations: DEFAULT_DECORATIONS,
  pageSize: "A4",
  orientation: "portrait",
  answerSheetType: "SEPARATE",
  layout: "SINGLE_COLUMN",
  currentStep: 0,
  existingTemplateId: null,
}
