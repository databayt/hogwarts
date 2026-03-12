// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getQuestionForWizard } from "./actions"

export interface QuestionWizardData {
  id: string
  schoolId: string
  subjectId: string
  questionText: string
  questionType: string
  difficulty: string
  bloomLevel: string
  points: number
  timeEstimate: number | null
  options: unknown | null
  sampleAnswer: string | null
  gradingRubric: string | null
  tags: string[]
  explanation: string | null
  source: string
  imageUrl: string | null
  createdBy: string
  wizardStep: string | null
  subject: { id: string; subjectName: string }
}

export const {
  Provider: QuestionWizardProvider,
  useWizardData: useQuestionWizard,
} = createWizardProvider<QuestionWizardData>("Question", {
  loadFn: getQuestionForWizard,
})
