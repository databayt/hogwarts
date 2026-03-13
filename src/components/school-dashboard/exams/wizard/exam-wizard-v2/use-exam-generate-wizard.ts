// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getGeneratedExamForWizard } from "./wizard-actions"

export interface ExamGenerateWizardData {
  id: string
  schoolId: string
  wizardStep: string | null
  templateId: string | null
  examId: string
  isRandomized: boolean
  totalQuestions: number
  generationNotes: string | null
  // Loaded relations
  selectedQuestionIds: string[]
  // Paper config
  paperTemplate: string
  pageSize: string
  shuffleQuestions: boolean
  shuffleOptions: boolean
  versionCount: number
  showSchoolLogo: boolean
  showInstructions: boolean
  showPointsPerQuestion: boolean
  // Exam details (from linked Exam)
  examTitle: string
  examClassId: string
  examSubjectId: string
  examDate: Date
  examStartTime: string
  examDuration: number
  examTotalMarks: number
  examPassingMarks: number
  // Template info
  templateName: string | null
  templateSubjectId: string | null
}

export const {
  Provider: ExamGenerateWizardProvider,
  useWizardData: useExamGenerateWizard,
} = createWizardProvider<ExamGenerateWizardData>("ExamGenerate", {
  loadFn: getGeneratedExamForWizard,
})
