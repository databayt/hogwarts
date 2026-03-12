// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getExamForWizard } from "./actions"

export interface ExamWizardData {
  id: string
  schoolId: string
  title: string
  description: string | null
  classId: string
  subjectId: string
  examType: string
  examDate: Date
  startTime: string
  endTime: string
  duration: number
  totalMarks: number
  passingMarks: number
  instructions: string | null
  proctorMode: string
  shuffleQuestions: boolean
  shuffleOptions: boolean
  maxAttempts: number
  retakePenalty: number | null
  allowLateSubmit: boolean
  lateSubmitMinutes: number
  wizardStep: string | null
  class: { id: string; name: string }
  subject: { id: string; subjectName: string }
}

export const { Provider: ExamWizardProvider, useWizardData: useExamWizard } =
  createWizardProvider<ExamWizardData>("Exam", {
    loadFn: getExamForWizard,
  })
