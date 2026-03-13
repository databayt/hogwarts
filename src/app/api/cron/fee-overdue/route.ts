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

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startTime = Date.now()
    const now = new Date()

    // Find all fee assignments that are PENDING or PARTIAL (not yet marked OVERDUE)
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

    let overdueCount = 0
    let notificationsCreated = 0

    for (const assignment of pendingAssignments) {
      // Check if any payment schedule entry has a past due date
      const isOverdue = hasOverdueScheduleEntry(
        assignment.feeStructure.paymentSchedule,
        now
      )

      if (!isOverdue) continue

      overdueCount++

      // Update status to OVERDUE
      await db.feeAssignment.update({
        where: { id: assignment.id },
        data: { status: "OVERDUE" },
      })

      // Resolve student userId and guardians
      const student = await db.student.findUnique({
        where: { id: assignment.studentId },
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

      if (!student) continue

      const amount = assignment.finalAmount.toString()
      const feeName = assignment.feeStructure.name

      // Collect all recipient userIds (student + guardians)
      const recipientIds: string[] = []
      if (student.userId) {
        recipientIds.push(student.userId)
      }
      for (const sg of student.studentGuardians) {
        if (sg.guardian.userId) {
          recipientIds.push(sg.guardian.userId)
        }
      }

      // Dispatch notification to each recipient
      for (const userId of recipientIds) {
        const result = await dispatchNotification({
          schoolId: assignment.schoolId,
          userId,
          type: "fee_overdue",
          title: "Overdue Payment Notice",
          body: `Fee payment of ${amount} for "${feeName}" is overdue. Please make payment immediately.`,
          priority: "urgent",
          channels: ["in_app", "email"],
          metadata: {
            feeAssignmentId: assignment.id,
            url: "/finance/fees",
          },
        })
        if (result) notificationsCreated++
      }
    }

    return NextResponse.json({
      success: true,
      checked: pendingAssignments.length,
      overdueDetected: overdueCount,
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
