// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface ExamWizardState {
  // Step 1: Template selection
  templateId: string | null

  // Step 2: Exam selection/creation
  examMode: "existing" | "new"
  existingExamId: string | null
  // New exam fields
  newExamTitle: string
  newExamClassId: string
  newExamSubjectId: string
  newExamDate: string // ISO date
  newExamStartTime: string // HH:MM
  newExamDuration: number
  newExamTotalMarks: number
  newExamPassingMarks: number

  // Step 3: Question selection
  selectedQuestionIds: string[]
  autoFilled: boolean

  // Step 4: Paper config
  paperTemplate: "CLASSIC" | "MODERN" | "FORMAL" | "CUSTOM"
  pageSize: "A4" | "Letter"
  shuffleQuestions: boolean
  shuffleOptions: boolean
  versionCount: number
  showSchoolLogo: boolean
  showInstructions: boolean
  showPointsPerQuestion: boolean

  // Navigation
  currentStep: number
}

export type ExamWizardAction =
  | { type: "SET_TEMPLATE"; payload: string }
  | { type: "SET_EXAM_MODE"; payload: "existing" | "new" }
  | { type: "SET_EXISTING_EXAM"; payload: string }
  | {
      type: "SET_NEW_EXAM"
      payload: Partial<
        Pick<
          ExamWizardState,
          | "newExamTitle"
          | "newExamClassId"
          | "newExamSubjectId"
          | "newExamDate"
          | "newExamStartTime"
          | "newExamDuration"
          | "newExamTotalMarks"
          | "newExamPassingMarks"
        >
      >
    }
  | { type: "SET_QUESTIONS"; payload: string[] }
  | { type: "SET_AUTO_FILLED"; payload: boolean }
  | { type: "SET_PAPER_CONFIG"; payload: Partial<ExamWizardState> }
  | { type: "SET_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }

export const INITIAL_EXAM_WIZARD_STATE: ExamWizardState = {
  templateId: null,
  examMode: "new",
  existingExamId: null,
  newExamTitle: "",
  newExamClassId: "",
  newExamSubjectId: "",
  newExamDate: "",
  newExamStartTime: "09:00",
  newExamDuration: 60,
  newExamTotalMarks: 100,
  newExamPassingMarks: 50,
  selectedQuestionIds: [],
  autoFilled: false,
  paperTemplate: "CLASSIC",
  pageSize: "A4",
  shuffleQuestions: true,
  shuffleOptions: true,
  versionCount: 1,
  showSchoolLogo: true,
  showInstructions: true,
  showPointsPerQuestion: true,
  currentStep: 0,
}

export interface TemplateOption {
  id: string
  name: string
  subjectName: string
  subjectId: string
  duration: number
  totalMarks: number
  totalQuestions: number
  distribution: Record<string, Record<string, number>>
}

export interface ExamOption {
  id: string
  title: string
  className: string
  subjectName: string
  examDate: string
  status: string
}

export interface ClassOption {
  id: string
  name: string
  subjectId: string
  subjectName: string
}

export interface QuestionOption {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  bloomLevel: string
  points: number
  selected: boolean
}

export interface ExamWizardStepDef {
  id: string
  label: { en: string; ar: string }
  isComplete: (state: ExamWizardState) => boolean
}
