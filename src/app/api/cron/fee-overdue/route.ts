// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Fee Overdue Detection
 *
 * Detects overdue fee assignments and sends notifications to students and guardians.
 *
 * TRIGGER: Daily at 9:00 AM (0 9 * * *)
 *
 * EXECUTION FLOW:
 * 1. Verify CRON_SECRET authorization
 * 2. Find all FeeAssignments with status PENDING or PARTIAL
 * 3. Join with FeeStructure to get paymentSchedule
 * 4. Parse paymentSchedule JSON, check if any dueDate is in the past
 * 5. Update status to OVERDUE and dispatch notifications (only on first detection)
 * 6. Return execution report
 *
 * TARGETING:
 * - Student (via student.userId)
 * - Guardians (via student.studentGuardians -> guardian.userId)
 */

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"

interface PaymentScheduleEntry {
  dueDate: string
  amount: number
  description?: string
}

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

function hasOverdueScheduleEntry(paymentSchedule: unknown, now: Date): boolean {
  if (!Array.isArray(paymentSchedule)) return false

  return paymentSchedule.some((entry: PaymentScheduleEntry) => {
    if (!entry.dueDate) return false
    const dueDate = new Date(entry.dueDate)
    return dueDate < now
  })
}

/** How many days between recurring overdue reminders */
const REMINDER_INTERVAL_DAYS = 7

/**
 * Resolve student + guardian userIds for a given studentId
 */
async function getRecipientIds(studentId: string): Promise<string[]> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      userId: true,
      studentGuardians: {
        select: {
          guardian: {
            select: { userId: true },
          },
        },
      },
    },
  })

  if (!student) return []

  const ids: string[] = []
  if (student.userId) ids.push(student.userId)
  for (const sg of student.studentGuardians) {
    if (sg.guardian.userId) ids.push(sg.guardian.userId)
  }
  return ids
}

/**
 * Get school preferred language (cached per request via Map)
 */
async function getSchoolLang(
  schoolId: string,
  cache: Map<string, string>
): Promise<string> {
  if (cache.has(schoolId)) return cache.get(schoolId)!
  const school = await db.school.findFirst({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  const lang = school?.preferredLanguage ?? "ar"
  cache.set(schoolId, lang)
  return lang
}

/**
 * Send overdue notifications to all recipients for an assignment
 */
async function notifyOverdue(
  assignment: {
    id: string
    schoolId: string
    studentId: string
    finalAmount: { toString(): string }
    feeStructure: { name: string }
  },
  lang: string
): Promise<number> {
  const recipientIds = await getRecipientIds(assignment.studentId)
  if (recipientIds.length === 0) return 0

  const amount = assignment.finalAmount.toString()
  const feeName = assignment.feeStructure.name
  const isAr = lang === "ar"

  let count = 0
  for (const userId of recipientIds) {
    const result = await dispatchNotification({
      schoolId: assignment.schoolId,
      userId,
      type: "fee_overdue",
      title: isAr ? "إشعار دفعة متأخرة" : "Overdue Payment Notice",
      body: isAr
        ? `دفعة ${amount} لـ "${feeName}" متأخرة. يرجى الدفع فوراً.`
        : `Fee payment of ${amount} for "${feeName}" is overdue. Please make payment immediately.`,
      priority: "urgent",
      channels: ["in_app", "email"],
      lang,
      metadata: {
        feeAssignmentId: assignment.id,
        url: "/finance/fees",
      },
    })
    if (result) count++
  }
  return count
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startTime = Date.now()
    const now = new Date()
    const schoolLangCache = new Map<string, string>()

    let newlyOverdue = 0
    let remindersResent = 0
    let notificationsCreated = 0

    // ── Phase 1: Detect newly overdue (PENDING/PARTIAL → OVERDUE) ──

    const pendingAssignments = await db.feeAssignment.findMany({
      where: {
        status: { in: ["PENDING", "PARTIAL"] },
      },
      select: {
        id: true,
        schoolId: true,
        studentId: true,
        finalAmount: true,
        status: true,
        feeStructure: {
          select: {
            name: true,
            paymentSchedule: true,
          },
        },
      },
    })

    for (const assignment of pendingAssignments) {
      if (
        !hasOverdueScheduleEntry(assignment.feeStructure.paymentSchedule, now)
      )
        continue

      newlyOverdue++

      await db.feeAssignment.update({
        where: { id: assignment.id },
        data: { status: "OVERDUE" },
      })

      const lang = await getSchoolLang(assignment.schoolId, schoolLangCache)
      notificationsCreated += await notifyOverdue(assignment, lang)
    }

    // ── Phase 2: Re-notify already OVERDUE (every 7 days) ──

    const overdueAssignments = await db.feeAssignment.findMany({
      where: {
        status: "OVERDUE",
      },
      select: {
        id: true,
        schoolId: true,
        studentId: true,
        finalAmount: true,
        feeStructure: {
          select: {
            name: true,
          },
        },
      },
    })

    const reminderCutoff = new Date(
      now.getTime() - REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    )

    for (const assignment of overdueAssignments) {
      // Check if we already sent a fee_overdue notification for this assignment
      // within the reminder interval
      const recentNotification = await db.notification.findFirst({
        where: {
          schoolId: assignment.schoolId,
          type: "fee_overdue",
          createdAt: { gte: reminderCutoff },
          metadata: {
            path: ["feeAssignmentId"],
            equals: assignment.id,
          },
        },
        select: { id: true },
      })

      if (recentNotification) continue

      remindersResent++
      const lang = await getSchoolLang(assignment.schoolId, schoolLangCache)
      notificationsCreated += await notifyOverdue(assignment, lang)
    }

    return NextResponse.json({
      success: true,
      checked: pendingAssignments.length + overdueAssignments.length,
      newlyOverdue,
      remindersResent,
      notificationsCreated,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[fee-overdue] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
