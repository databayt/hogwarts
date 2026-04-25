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

type LateFeeType = "FIXED" | "PERCENTAGE" | "DAILY" | "MONTHLY"

/**
 * Calculate late fee charge based on the fee structure's late fee policy.
 */
function calculateLateFee(
  lateFeeType: LateFeeType,
  lateFeeAmount: number,
  finalAmount: number,
  daysOverdue: number
): number {
  switch (lateFeeType) {
    case "FIXED":
      return lateFeeAmount
    case "PERCENTAGE":
      return (finalAmount * lateFeeAmount) / 100
    case "DAILY":
      return lateFeeAmount * daysOverdue
    case "MONTHLY":
      return lateFeeAmount * Math.floor(daysOverdue / 30)
    default:
      return 0
  }
}

/**
 * Get the earliest overdue date from a payment schedule.
 */
function getEarliestOverdueDate(
  paymentSchedule: unknown,
  now: Date
): Date | null {
  if (!Array.isArray(paymentSchedule)) return null

  let earliest: Date | null = null
  for (const entry of paymentSchedule as PaymentScheduleEntry[]) {
    if (!entry.dueDate) continue
    const dueDate = new Date(entry.dueDate)
    if (dueDate < now && (!earliest || dueDate < earliest)) {
      earliest = dueDate
    }
  }
  return earliest
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
      channels: ["in_app", "email", "whatsapp"],
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
    let lateFeesCharged = 0

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
            lateFeeAmount: true,
            lateFeeType: true,
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

      // Apply late fee if configured on the fee structure
      const lateFeeAmount = assignment.feeStructure.lateFeeAmount
        ? Number(assignment.feeStructure.lateFeeAmount)
        : 0
      const lateFeeType = assignment.feeStructure
        .lateFeeType as LateFeeType | null

      if (lateFeeAmount > 0 && lateFeeType) {
        const earliestOverdue = getEarliestOverdueDate(
          assignment.feeStructure.paymentSchedule,
          now
        )
        const daysOverdue = earliestOverdue
          ? Math.max(
              1,
              Math.floor(
                (now.getTime() - earliestOverdue.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 1

        const charge = calculateLateFee(
          lateFeeType,
          lateFeeAmount,
          Number(assignment.finalAmount),
          daysOverdue
        )

        if (charge > 0) {
          await db.fine.create({
            data: {
              schoolId: assignment.schoolId,
              studentId: assignment.studentId,
              fineType: "LATE_FEE",
              amount: charge,
              reason: `Late fee for ${assignment.feeStructure.name}`,
              dueDate: now,
            },
          })
          lateFeesCharged++
        }
      }

      const lang = await getSchoolLang(assignment.schoolId, schoolLangCache)
      notificationsCreated += await notifyOverdue(assignment, lang)
    }

    // ── Phase 2: Re-notify already OVERDUE (every 7 days) + recurring late fees ──

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
            paymentSchedule: true,
            lateFeeAmount: true,
            lateFeeType: true,
          },
        },
      },
    })

    const reminderCutoff = new Date(
      now.getTime() - REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    )

    for (const assignment of overdueAssignments) {
      // ── Recurring late fees for DAILY/MONTHLY types ──
      const lateFeeAmount = assignment.feeStructure.lateFeeAmount
        ? Number(assignment.feeStructure.lateFeeAmount)
        : 0
      const lateFeeType = assignment.feeStructure
        .lateFeeType as LateFeeType | null

      if (lateFeeAmount > 0 && lateFeeType) {
        const feeReasonMatch = `Late fee for ${assignment.feeStructure.name}`

        const existingFine = await db.fine.findFirst({
          where: {
            schoolId: assignment.schoolId,
            studentId: assignment.studentId,
            fineType: "LATE_FEE",
            reason: { contains: assignment.feeStructure.name },
          },
          orderBy: { createdAt: "desc" },
        })

        if (lateFeeType === "DAILY") {
          // Update existing fine's amount based on total days overdue
          const earliestOverdue = getEarliestOverdueDate(
            assignment.feeStructure.paymentSchedule,
            now
          )
          const daysOverdue = earliestOverdue
            ? Math.max(
                1,
                Math.floor(
                  (now.getTime() - earliestOverdue.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : 1
          const totalCharge = lateFeeAmount * daysOverdue

          if (existingFine && !existingFine.isPaid && !existingFine.isWaived) {
            await db.fine.update({
              where: { id: existingFine.id },
              data: { amount: totalCharge },
            })
          } else if (!existingFine) {
            await db.fine.create({
              data: {
                schoolId: assignment.schoolId,
                studentId: assignment.studentId,
                fineType: "LATE_FEE",
                amount: totalCharge,
                reason: feeReasonMatch,
                dueDate: now,
              },
            })
          }
          lateFeesCharged++
        } else if (lateFeeType === "MONTHLY") {
          // Create new fine if last one was 30+ days ago
          const shouldCharge =
            !existingFine ||
            now.getTime() - existingFine.createdAt.getTime() >=
              30 * 24 * 60 * 60 * 1000

          if (shouldCharge) {
            await db.fine.create({
              data: {
                schoolId: assignment.schoolId,
                studentId: assignment.studentId,
                fineType: "LATE_FEE",
                amount: lateFeeAmount,
                reason: feeReasonMatch,
                dueDate: now,
              },
            })
            lateFeesCharged++
          }
        }
        // FIXED and PERCENTAGE: already charged once in Phase 1, skip
      }

      // ── Recurring overdue reminders ──
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
      lateFeesCharged,
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
