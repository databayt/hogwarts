// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Domain types shared across exam wizards (template, generate, cert)

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

export const INITIAL_STATE = {
  selectedPresetId: null,
  name: "",
  description: "",
  subjectIds: [] as string[],
  gradeIds: [] as string[],
  duration: 60,
  totalMarks: 100,
  examType: "MIDTERM" as ExamType,
  questionTypes: [] as QuestionTypeConfig[],
  headerVariant: "standard",
  footerVariant: "standard",
  studentInfoVariant: "standard",
  instructionsVariant: "standard",
  answerSheetVariant: "standard",
  coverVariant: "standard",
  passingScore: 50,
  gradeBoundaries: DEFAULT_GRADE_BOUNDARIES,
  decorations: DEFAULT_DECORATIONS,
  pageSize: "A4" as const,
  orientation: "portrait" as const,
  answerSheetType: "SEPARATE" as const,
  layout: "SINGLE_COLUMN" as const,
}
