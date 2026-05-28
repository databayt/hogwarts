// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import {
  ComplianceProvider,
  ComplianceSubmissionStatus,
  ConnectorMode,
} from "@prisma/client"

import { db } from "@/lib/db"

export interface ComplianceConfigDTO {
  id: string
  schoolId: string
  provider: ComplianceProvider
  enabled: boolean
  mode: ConnectorMode
  submissionTimeUtc: string
  parentContactSlaMinutes: number
  notifyAdminOnFailure: boolean
  sharedGroupId: string | null
  lastSubmissionAt: Date | null
  lastSubmissionStatus: ComplianceSubmissionStatus | null
}

export async function getComplianceConfigForSchool(
  schoolId: string,
  provider: ComplianceProvider = ComplianceProvider.ADEK_ESIS
): Promise<ComplianceConfigDTO | null> {
  const row = await db.schoolComplianceConfig.findUnique({
    where: { schoolId_provider: { schoolId, provider } },
  })
  if (!row) return null
  return {
    id: row.id,
    schoolId: row.schoolId,
    provider: row.provider,
    enabled: row.enabled,
    mode: row.mode,
    submissionTimeUtc: row.submissionTimeUtc,
    parentContactSlaMinutes: row.parentContactSlaMinutes,
    notifyAdminOnFailure: row.notifyAdminOnFailure,
    sharedGroupId: row.sharedGroupId,
    lastSubmissionAt: row.lastSubmissionAt,
    lastSubmissionStatus: row.lastSubmissionStatus,
  }
}

export interface SubmissionRowDTO {
  id: string
  submissionDate: Date
  attemptNumber: number
  mode: ConnectorMode
  status: ComplianceSubmissionStatus
  payloadStudentCount: number
  payloadAbsentCount: number
  receiptId: string | null
  errorCode: string | null
  csvArtifactUrl: string | null
  submittedAt: Date | null
  acknowledgedAt: Date | null
}

export async function listRecentSubmissions(
  schoolId: string,
  limit = 30
): Promise<SubmissionRowDTO[]> {
  const rows = await db.complianceSubmission.findMany({
    where: { schoolId },
    orderBy: [{ submissionDate: "desc" }, { attemptNumber: "desc" }],
    take: limit,
    select: {
      id: true,
      submissionDate: true,
      attemptNumber: true,
      mode: true,
      status: true,
      payloadStudentCount: true,
      payloadAbsentCount: true,
      receiptId: true,
      errorCode: true,
      csvArtifactUrl: true,
      submittedAt: true,
      acknowledgedAt: true,
    },
  })
  return rows
}

/**
 * Parent-contact SLA evidence report for ADEK audits.
 * For each ABSENT row in range, return whether a guardian contact intervention
 * was created within `slaMinutes` after `markedAt`.
 */
export async function getParentContactSlaReport(
  schoolId: string,
  from: Date,
  to: Date,
  slaMinutes = 120
): Promise<{
  totalAbsences: number
  contactedWithinSla: number
  contactedLate: number
  notContacted: number
}> {
  const absences = await db.attendance.findMany({
    where: {
      schoolId,
      status: "ABSENT",
      date: { gte: from, lte: to },
      deletedAt: null,
    },
    select: {
      id: true,
      studentId: true,
      markedAt: true,
    },
  })

  if (absences.length === 0) {
    return {
      totalAbsences: 0,
      contactedWithinSla: 0,
      contactedLate: 0,
      notContacted: 0,
    }
  }

  const studentIds = Array.from(new Set(absences.map((a) => a.studentId)))
  const interventions = await db.attendanceIntervention.findMany({
    where: {
      schoolId,
      studentId: { in: studentIds },
      type: { in: ["PARENT_PHONE_CALL", "PARENT_EMAIL"] },
      parentNotified: true,
      createdAt: { gte: from },
    },
    select: { studentId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  // Group interventions by student → first contact timestamp
  const firstContactByStudent = new Map<string, Date>()
  for (const i of interventions) {
    if (!firstContactByStudent.has(i.studentId)) {
      firstContactByStudent.set(i.studentId, i.createdAt)
    }
  }

  let contactedWithinSla = 0
  let contactedLate = 0
  let notContacted = 0
  const slaMs = slaMinutes * 60 * 1000
  for (const a of absences) {
    const contact = firstContactByStudent.get(a.studentId)
    if (!contact) {
      notContacted++
      continue
    }
    if (contact.getTime() - a.markedAt.getTime() <= slaMs) {
      contactedWithinSla++
    } else {
      contactedLate++
    }
  }

  return {
    totalAbsences: absences.length,
    contactedWithinSla,
    contactedLate,
    notContacted,
  }
}
