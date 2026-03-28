// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface PendingExamItem {
  id: string
  title: string
  examType: string
  subjectName: string
  contributedSchoolName: string | null
  contributedBy: string | null
  createdAt: Date
  questionCount: number
  totalMarks: number | null
}

export interface PendingExamListResult {
  items: PendingExamItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PendingExamTemplateItem {
  id: string
  name: string
  examType: string
  subjectName: string
  contributedSchoolName: string | null
  contributedBy: string | null
  createdAt: Date
  duration: number
  totalMarks: number
}

export interface PendingTemplateListResult {
  items: PendingExamTemplateItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
