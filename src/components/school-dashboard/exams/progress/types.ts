// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string; details?: unknown }

export interface ProgressScheduleSummary {
  id: string
  gradeId: string | null
  sectionId: string | null
  /** The scope's name (section, grade, or a legacy class); null = school. */
  className: string | null
  frequency: string
  isActive: boolean
  includeExamResults: boolean
  includeAttendance: boolean
  includeAssignments: boolean
  includeBehavior: boolean
  recipientTypes: string[]
  channels: string[]
  lastRunAt: Date | null
  nextRunAt: Date | null
  reportCount: number
  createdAt: Date
}

export interface GenerateReportsOutput {
  generated: number
  failed: number
}

export interface GeneratedReportSummary {
  id: string
  studentId: string
  studentName: string
  reportData: any
  sentAt: Date | null
  createdAt: Date
}
