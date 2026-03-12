// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getGradeForWizard } from "./actions"

export interface GradeWizardData {
  id: string
  schoolId: string
  studentId: string
  classId: string
  assignmentId: string | null
  examId: string | null
  subjectId: string | null
  score: number
  maxScore: number
  percentage: number
  grade: string
  title: string | null
  description: string | null
  feedback: string | null
  submittedAt: Date | null
  gradedAt: Date
  gradedBy: string | null
  yearLevelId: string | null
  wizardStep: string | null
  student: { id: string; givenName: string; surname: string } | null
  class: { id: string; name: string } | null
  assignment: { id: string; title: string } | null
  exam: { id: string; title: string } | null
  subject: { id: string; subjectName: string } | null
}

export const { Provider: GradeWizardProvider, useWizardData: useGradeWizard } =
  createWizardProvider<GradeWizardData>("Grade", {
    loadFn: getGradeForWizard,
  })
