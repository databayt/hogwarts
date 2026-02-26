// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string; details?: unknown }

export interface QuickAssessmentSummary {
  id: string
  title: string
  type: string
  status: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  questionCount: number
  responseCount: number
  duration: number
  createdAt: Date
}

export interface QuickAssessmentResults {
  assessmentId: string
  title: string
  totalResponses: number
  questionResults: Array<{
    questionId: string
    questionText: string
    responses: Array<{
      answer: unknown
      count: number
      isCorrect?: boolean
    }>
  }>
}
