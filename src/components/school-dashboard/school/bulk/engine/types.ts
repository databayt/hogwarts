// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** Shapes shared by the planner, the runner, the actions and the dialog.
 *  Client-safe: types only. */

import type { ImportType } from "../fields"

export interface ImportOptions {
  /** Matched people get their changed fields written instead of skipped. */
  updateExisting: boolean
  /** Create sections and departments the file names but the school lacks. */
  createMissing: boolean
  /** Queue welcome emails to imported students' families. */
  notifyFamilies: boolean
}

export type IssueLevel = "error" | "warning"

/** A coded message — the dialog translates `code` with `params`. */
export interface Issue {
  row: number
  code: string
  level: IssueLevel
  params?: Record<string, string | number>
}

export type RowAction = "create" | "update" | "skip" | "error"

export interface GuardianInput {
  relation: "father" | "mother" | "guardian"
  firstName: string
  lastName: string
  email?: string
  phone?: string
}

export interface StudentRec {
  kind: "students"
  firstName: string
  lastName: string
  middleName?: string
  admissionNumber?: string
  email?: string
  phone?: string
  gender?: "male" | "female"
  dateOfBirth?: string
  gradeId?: string
  gradeLabel?: string
  sectionId?: string
  newSection?: { gradeId: string; letter: number }
  guardians: GuardianInput[]
}

export interface TeacherRec {
  kind: "teachers"
  firstName: string
  lastName: string
  employeeId?: string
  email?: string
  phone?: string
  gender?: "male" | "female"
  departmentId?: string
  newDepartment?: string
  subjectIds: string[]
}

export interface StaffRec {
  kind: "staff"
  firstName: string
  lastName: string
  employeeId?: string
  email?: string
  phone?: string
  gender?: "male" | "female"
  position?: string
  employmentType?: string
  departmentId?: string
  newDepartment?: string
}

export interface GuardianRec {
  kind: "guardians"
  firstName: string
  lastName: string
  email?: string
  phone?: string
  relation: "father" | "mother" | "guardian"
  /** Student row ids to link (resolved from the file's student codes). */
  studentIds: string[]
}

export type Rec = StudentRec | TeacherRec | StaffRec | GuardianRec

export interface PlannedRow {
  row: number
  action: RowAction
  name: string
  /** Short context for the preview: grade/section, position, … */
  summary?: string
  matchId?: string
  rec?: Rec
  /** UPDATE only: scalar fields to write, and their current values. */
  patch?: Record<string, unknown>
  before?: Record<string, unknown>
  /** UPDATE only: field keys that change, for the preview. */
  changes?: string[]
  issues: Issue[]
}

export interface PlanResult {
  rows: PlannedRow[]
  counts: Record<RowAction, number>
}

/** What the dialog receives — the planned rows without their payloads. */
export interface PreviewRow {
  row: number
  action: RowAction
  name: string
  summary?: string
  changes?: string[]
  issues: Issue[]
}

export interface PreviewResult {
  counts: Record<RowAction, number>
  rows: PreviewRow[]
}

export type BatchStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED" | "UNDONE"

export interface BatchSummary {
  id: string
  type: ImportType
  fileName: string
  status: BatchStatus
  /** RUNNING but silent for a while — the process that ran it is gone. */
  stalled: boolean
  total: number
  processed: number
  created: number
  updated: number
  skipped: number
  failed: number
  createdAt: string
  finishedAt: string | null
  undoneAt: string | null
  /** Accounts made by this batch that have never signed in. */
  pendingLogins: number
}

export interface BatchDetail extends BatchSummary {
  issues: Issue[]
}

export interface LoginCredential {
  name: string
  role: string
  username: string
  email: string | null
  password: string
}

export interface ReissueResult {
  credentials: LoginCredential[]
  /** Accounts left alone because their owner already signed in. */
  active: number
}

export interface UndoResult {
  removed: number
  restored: number
  /** Records kept because they are in use (signed in, linked elsewhere). */
  kept: number
}
