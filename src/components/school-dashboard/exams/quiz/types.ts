// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface QuizItem {
  id: string
  title: string
  examType: string
  durationMinutes: number | null
  totalMarks: number | null
  totalQuestions: number | null
  usageCount: number
  subjectName: string
  subjectSlug: string
  subjectColor: string | null
  chapterName: string | null
  lessonName: string | null
}

export interface QuizQuestionStats {
  catalogSubjectId: string
  subjectName: string
  totalQuestions: number
  byDifficulty: Record<string, number>
  byType: Record<string, number>
}

export interface QuizSubjectFilter {
  id: string
  name: string
  slug: string
}
