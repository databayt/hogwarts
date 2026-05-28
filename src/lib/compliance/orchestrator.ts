// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import {
  ComplianceProvider,
  ComplianceSubmissionStatus,
  ConnectorMode,
} from "@prisma/client"

import { logAudit } from "@/lib/audit-log"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"

import { ComplianceAudit } from "./audit-actions"
import { buildAdekArtifact } from "./providers/adek/dry-run"
import { getConnector } from "./registry"
import type {
  ComplianceAttendanceRecord,
  ComplianceSubmissionPayload,
} from "./types"

/**
 * Build the regulator-agnostic payload for one school × one day.
 * Joins Attendance with AttendanceExcuse (approved only) and computes a
 * rolling-30d absence percent per student (used by ADEK cause-for-concern rule).
 *
 * Exported so the worker claim route can reuse the exact same logic — DO NOT
 * duplicate this elsewhere or rolling-30d% will drift across submission paths.
 */
export async function buildPayloadForDay(
  schoolId: string,
  date: Date
): Promise<ComplianceSubmissionPayload> {
  const dayStart = new Date(date)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
  const thirtyDaysAgo = new Date(dayStart)
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)

  const [school, dayAttendance, recent30dAttendance] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    }),
    db.attendance.findMany({
      where: {
        schoolId,
        date: { gte: dayStart, lt: dayEnd },
        deletedAt: null,
      },
      select: {
        studentId: true,
        status: true,
        notes: true,
        student: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
        excuse: { select: { status: true } },
      },
    }),
    db.attendance.findMany({
      where: {
        schoolId,
        date: { gte: thirtyDaysAgo, lt: dayEnd },
        deletedAt: null,
      },
      select: { studentId: true, status: true },
    }),
  ])

  // Compute rolling 30d absence percent per student
  const perStudent = new Map<string, { absent: number; total: number }>()
  for (const a of recent30dAttendance) {
    const slot = perStudent.get(a.studentId) ?? { absent: 0, total: 0 }
    slot.total += 1
    if (a.status === "ABSENT") slot.absent += 1
    perStudent.set(a.studentId, slot)
  }

  const records: ComplianceAttendanceRecord[] = dayAttendance.map((a) => {
    const slot = perStudent.get(a.studentId) ?? { absent: 0, total: 0 }
    const pct = slot.total === 0 ? 0 : (slot.absent / slot.total) * 100
    const fullName = [
      a.student.firstName,
      a.student.middleName,
      a.student.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim()
    return {
      studentId: a.studentId,
      externalStudentRef: null,
      fullName,
      status: a.status as ComplianceAttendanceRecord["status"],
      hasApprovedExcuse: a.excuse?.status === "APPROVED",
      rolling30dAbsencePct: pct,
      notes: a.notes,
    }
  })

  return {
    schoolId,
    schoolName: school?.name ?? "Unknown",
    schoolExternalRef: null,
    submissionDate: dayStart,
    records,
  }
}

/**
 * Process one queued submission. Optimistically locks the row by transitioning
 * QUEUED → IN_FLIGHT (no-op if already taken by another worker).
 *
 * Returns the final status the row was set to.
 */
export async function processSubmission(
  submissionId: string
): Promise<ComplianceSubmissionStatus> {
  // Optimistic claim
  const claimed = await db.complianceSubmission.updateMany({
    where: { id: submissionId, status: ComplianceSubmissionStatus.QUEUED },
    data: { status: ComplianceSubmissionStatus.IN_FLIGHT },
  })
  if (claimed.count === 0) {
    const current = await db.complianceSubmission.findUnique({
      where: { id: submissionId },
      select: { status: true },
    })
    return current?.status ?? ComplianceSubmissionStatus.FAILED
  }

  const submission = await db.complianceSubmission.findUnique({
    where: { id: submissionId },
  })
  if (!submission) return ComplianceSubmissionStatus.FAILED

  // RPA mode is handled out-of-band by the Fly.io worker. Release the
  // IN_FLIGHT lock back to QUEUED so the worker can claim. No submission
  // happens in this code path.
  if (submission.mode === ConnectorMode.RPA) {
    await db.complianceSubmission.update({
      where: { id: submissionId },
      data: { status: ComplianceSubmissionStatus.QUEUED },
    })
    return ComplianceSubmissionStatus.QUEUED
  }

  const connector = getConnector(submission.provider, submission.mode)
  if (!connector) {
    await db.complianceSubmission.update({
      where: { id: submissionId },
      data: {
        status: ComplianceSubmissionStatus.FAILED,
        errorCode: "CONNECTOR_NOT_FOUND",
        errorMessage: `No connector for ${submission.provider} / ${submission.mode}`,
      },
    })
    return ComplianceSubmissionStatus.FAILED
  }

  const payload = await buildPayloadForDay(
    submission.schoolId,
    submission.submissionDate
  )

  // Build the CSV artifact once — used for both submission and audit-download.
  // Persist for every mode (not just DRY_RUN) so audit history is complete.
  const artifact = buildAdekArtifact(payload)

  let result
  try {
    result = await connector.submit(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db.complianceSubmission.update({
      where: { id: submissionId },
      data: {
        status: ComplianceSubmissionStatus.FAILED,
        errorCode: "CONNECTOR_THREW",
        errorMessage: message,
        csvArtifactContent: artifact.csv,
        csvArtifactSha256: artifact.sha,
        payloadStudentCount: artifact.studentCount,
        payloadAbsentCount: artifact.absentCount,
        payloadCategorized: artifact.categorized as object,
      },
    })
    await logAudit({
      action: ComplianceAudit.SUBMISSION_FAILED,
      entityType: "ComplianceSubmission",
      entityId: submissionId,
      userId: null,
      schoolId: submission.schoolId,
      metadata: { errorCode: "CONNECTOR_THREW", message },
    })
    return ComplianceSubmissionStatus.FAILED
  }

  await db.complianceSubmission.update({
    where: { id: submissionId },
    data: {
      status: result.status,
      receiptId: result.receiptId ?? null,
      errorCode: result.errorCode ?? null,
      errorMessage: result.errorMessage ?? null,
      csvArtifactUrl: result.csvArtifactUrl ?? null,
      csvArtifactSha256: result.csvArtifactSha256 ?? artifact.sha,
      csvArtifactContent: artifact.csv,
      payloadStudentCount: artifact.studentCount,
      payloadAbsentCount: artifact.absentCount,
      payloadCategorized:
        (result.categorized as object | undefined) ??
        (artifact.categorized as object),
      submittedAt: new Date(),
    },
  })

  // Audit
  if (
    result.status === ComplianceSubmissionStatus.SUBMITTED ||
    result.status === ComplianceSubmissionStatus.ACCEPTED
  ) {
    await logAudit({
      action: ComplianceAudit.SUBMISSION_SUBMITTED,
      entityType: "ComplianceSubmission",
      entityId: submissionId,
      userId: null,
      schoolId: submission.schoolId,
      metadata: {
        provider: submission.provider,
        mode: submission.mode,
        receiptId: result.receiptId,
        categorized: result.categorized,
      },
    })
  } else if (
    result.status === ComplianceSubmissionStatus.FAILED ||
    result.status === ComplianceSubmissionStatus.REJECTED
  ) {
    await logAudit({
      action:
        result.status === ComplianceSubmissionStatus.REJECTED
          ? ComplianceAudit.SUBMISSION_REJECTED
          : ComplianceAudit.SUBMISSION_FAILED,
      entityType: "ComplianceSubmission",
      entityId: submissionId,
      userId: null,
      schoolId: submission.schoolId,
      metadata: {
        provider: submission.provider,
        mode: submission.mode,
        errorCode: result.errorCode,
      },
    })

    // Circuit breaker (PIGGYBACK only) — increment shared group failures
    if (submission.mode === ConnectorMode.PIGGYBACK) {
      await tripCircuitBreakerIfNeeded(submission.schoolId)
    }

    // Optionally notify admins
    const config = await db.schoolComplianceConfig.findFirst({
      where: { schoolId: submission.schoolId, provider: submission.provider },
      select: { notifyAdminOnFailure: true },
    })
    if (config?.notifyAdminOnFailure) {
      await notifySchoolAdminsOfFailure(submission.schoolId, submissionId)
    }
  }

  // Update config's last submission stamp
  await db.schoolComplianceConfig.updateMany({
    where: {
      schoolId: submission.schoolId,
      provider: submission.provider,
    },
    data: {
      lastSubmissionAt: new Date(),
      lastSubmissionStatus: result.status,
    },
  })

  return result.status
}

const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_WINDOW_MS = 60 * 60 * 1000 // 1 hour

async function tripCircuitBreakerIfNeeded(schoolId: string): Promise<void> {
  const config = await db.schoolComplianceConfig.findFirst({
    where: { schoolId, provider: ComplianceProvider.ADEK_ESIS },
    select: { sharedGroupId: true },
  })
  if (!config?.sharedGroupId) return

  const group = await db.sharedComplianceCredentialGroup.findUnique({
    where: { id: config.sharedGroupId },
  })
  if (!group || group.circuitBreakerState !== "CLOSED") return

  const next = group.recentFailures + 1
  const shouldOpen = next >= CIRCUIT_BREAKER_THRESHOLD

  await db.sharedComplianceCredentialGroup.update({
    where: { id: group.id },
    data: {
      recentFailures: next,
      ...(shouldOpen
        ? { circuitBreakerState: "OPEN", circuitOpenedAt: new Date() }
        : {}),
    },
  })

  if (shouldOpen) {
    await logAudit({
      action: ComplianceAudit.CIRCUIT_BREAKER_OPENED,
      entityType: "SharedComplianceCredentialGroup",
      entityId: group.id,
      userId: null,
      schoolId: null,
      metadata: { recentFailures: next },
    })
  }
}

/** Background-reset the breaker after the cooldown window. */
export async function maybeRecloseCircuitBreakers(): Promise<void> {
  const cutoff = new Date(Date.now() - CIRCUIT_BREAKER_WINDOW_MS)
  await db.sharedComplianceCredentialGroup.updateMany({
    where: {
      circuitBreakerState: "OPEN",
      circuitOpenedAt: { lt: cutoff },
    },
    data: {
      circuitBreakerState: "HALF_OPEN",
      recentFailures: 0,
    },
  })
}

async function notifySchoolAdminsOfFailure(
  schoolId: string,
  submissionId: string
): Promise<void> {
  const [school, admins] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    }),
    db.user.findMany({
      where: { schoolId, role: { in: ["ADMIN", "DEVELOPER"] } },
      select: { id: true },
    }),
  ])
  const lang =
    (school?.preferredLanguage as "ar" | "en" | undefined) === "en"
      ? "en"
      : "ar"
  const title =
    lang === "ar" ? "فشل إرسال بيانات الامتثال" : "Compliance submission failed"
  const body =
    lang === "ar"
      ? "تعذّر إرسال بيانات لجهة تنظيمية. افتح لوحة الامتثال لمراجعة التفاصيل."
      : "A regulator submission failed. Open the compliance dashboard for details."

  await Promise.all(
    admins.map((admin) =>
      dispatchNotification({
        schoolId,
        userId: admin.id,
        type: "system_alert",
        title,
        body,
        lang,
        priority: "high",
        channels: ["in_app", "email"],
        metadata: { submissionId },
      }).catch(() => {
        // best-effort, don't block the cron
      })
    )
  )
}

/**
 * Cron entry: enqueue today's submission for every eligible school whose
 * configured `submissionTimeUtc` has already passed by `now` (UTC).
 *
 * The Vercel cron fires at 10:00 UTC (= 14:00 GST — ADEK rule). Schools that
 * set a later submissionTimeUtc are skipped this run and picked up by the next
 * cron tick (or stay skipped if the cron only runs once per day).
 */
export async function enqueueDailySubmissions(now = new Date()): Promise<{
  queued: number
  skipped: number
}> {
  // Compute today in UTC (truncate to day boundary)
  const today = new Date(now)
  today.setUTCHours(0, 0, 0, 0)

  // Current HH:MM in UTC for the time-of-day comparison
  const hh = String(now.getUTCHours()).padStart(2, "0")
  const mm = String(now.getUTCMinutes()).padStart(2, "0")
  const nowHHMM = `${hh}:${mm}`

  const configs = await db.schoolComplianceConfig.findMany({
    where: { enabled: true, provider: ComplianceProvider.ADEK_ESIS },
    select: {
      schoolId: true,
      provider: true,
      mode: true,
      submissionTimeUtc: true,
    },
  })

  let queued = 0
  let skipped = 0
  for (const config of configs) {
    if (config.mode === ConnectorMode.DISABLED) {
      skipped += 1
      continue
    }
    // Lexicographic compare works for HH:MM strings.
    if (config.submissionTimeUtc > nowHHMM) {
      skipped += 1
      continue
    }
    // Have we already enqueued attempt #1 for today?
    const existing = await db.complianceSubmission.findUnique({
      where: {
        schoolId_provider_submissionDate_attemptNumber: {
          schoolId: config.schoolId,
          provider: config.provider,
          submissionDate: today,
          attemptNumber: 1,
        },
      },
      select: { id: true },
    })
    if (existing) {
      skipped += 1
      continue
    }
    await db.complianceSubmission.create({
      data: {
        schoolId: config.schoolId,
        provider: config.provider,
        submissionDate: today,
        attemptNumber: 1,
        mode: config.mode,
        status: ComplianceSubmissionStatus.QUEUED,
      },
    })
    queued += 1
  }
  return { queued, skipped }
}
