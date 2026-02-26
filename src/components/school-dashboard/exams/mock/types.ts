// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface MockExamItem {
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
}

export interface MockSubjectFilter {
  id: string
  name: string
  slug: string
}
