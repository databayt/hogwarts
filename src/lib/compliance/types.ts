// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  ComplianceProvider,
  ComplianceSubmissionStatus,
  ConnectorMode,
} from "@prisma/client"

/**
 * Generic record for one student × day, normalized to regulator-agnostic shape.
 * Each provider's mapper translates this into its own absence-category vocabulary.
 */
export interface ComplianceAttendanceRecord {
  studentId: string
  externalStudentRef: string | null // E.g., eSIS student ID — null if school hasn't mapped
  fullName: string
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "SICK" | "HOLIDAY"
  hasApprovedExcuse: boolean
  /** Rolling 30-day absence percentage (0-100). Used by ADEK cause-for-concern rule. */
  rolling30dAbsencePct: number
  notes?: string | null
}

export interface ComplianceSubmissionPayload {
  schoolId: string
  schoolName: string
  schoolExternalRef: string | null // School code in regulator's system, if known
  submissionDate: Date // UTC day boundary
  records: ComplianceAttendanceRecord[]
}

export interface SubmissionResult {
  status: ComplianceSubmissionStatus // SUBMITTED | ACCEPTED | REJECTED | FAILED | QUEUED
  receiptId?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  csvArtifactUrl?: string | null
  csvArtifactSha256?: string | null
  /** Provider-specific structured payload (e.g., ADEK category counts). */
  categorized?: Record<string, number>
}

export interface ComplianceConnector {
  /** Stable identifier — used in registry lookup. */
  id: string
  /** The mode this connector implements. */
  mode: ConnectorMode
  /** Quick health check: is everything needed (creds, env, group) present? */
  isConfigured: (schoolId: string) => Promise<boolean>
  /** Execute the submission. Must be idempotent on payload key (schoolId+date+attempt). */
  submit: (payload: ComplianceSubmissionPayload) => Promise<SubmissionResult>
}

export type ConnectorKey = `${ComplianceProvider}:${ConnectorMode}`

export function connectorKey(
  provider: ComplianceProvider,
  mode: ConnectorMode
): ConnectorKey {
  return `${provider}:${mode}` as ConnectorKey
}
