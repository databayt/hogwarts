// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import type {
  DecorationConfig,
  ExamType,
  GradeBoundary,
  QuestionTypeConfig,
} from "../types"
import { getTemplateForWizard } from "./wizard-actions"

export interface TemplateWizardData {
  id: string
  schoolId: string
  name: string
  description: string | null
  subjectId: string
  duration: number
  totalMarks: number
  wizardStep: string | null

  // Targeting
  gradeIds: string[]
  sectionIds: string[]
  classroomIds: string[]

  // Distribution (parsed from JSON)
  distribution: Record<string, Record<string, number>>
  questionTypes: QuestionTypeConfig[]
  examType: ExamType

  // Block config (parsed from JSON)
  headerVariant: string
  footerVariant: string
  studentInfoVariant: string
  instructionsVariant: string
  answerSheetVariant: string
  coverVariant: string
  decorations: DecorationConfig

  // Scoring config (parsed from JSON)
  passingScore: number
  gradeBoundaries: GradeBoundary[]

  // Print config (parsed from JSON)
  pageSize: "A4" | "LETTER"
  orientation: "portrait" | "landscape"
  answerSheetType: "NONE" | "SEPARATE" | "BUBBLE"
  layout: "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET"

  // Gallery
  selectedPresetId: string | null
}

export const {
  Provider: TemplateWizardProvider,
  useWizardData: useTemplateWizard,
} = createWizardProvider<TemplateWizardData>("ExamTemplate", {
  loadFn: getTemplateForWizard,
})
