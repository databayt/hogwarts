// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Assignment Due Reminders
 *
 * Sends notification reminders for assignments due in the next 24 hours.
 *
 * TRIGGER: Daily at 8:00 AM (0 8 * * *)
 *
 * EXECUTION FLOW:
 * 1. Verify CRON_SECRET authorization
 * 2. Find all non-DRAFT assignments with dueDate in the next 24 hours
 * 3. Dispatch notifications to class students per assignment
 * 4. Return execution report
 *
 * TARGETING:
 * - Scoped to class: Notifies all students enrolled in the assignment's class
 */

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startTime = Date.now()
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find assignments due in the next 24 hours (exclude drafts)
    const upcomingAssignments = await db.assignment.findMany({
      where: {
        status: { not: "DRAFT" },
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
      },
      select: {
        id: true,
        schoolId: true,
        classId: true,
        title: true,
        dueDate: true,
        school: {
          select: { preferredLanguage: true },
        },
      },
    })

    let totalCreated = 0

    for (const assignment of upcomingAssignments) {
      const dueDate = assignment.dueDate
        ? new Date(assignment.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "soon"

      const { created } = await dispatchNotificationsToAudience({
        schoolId: assignment.schoolId,
        type: "assignment_due",
        title: `Assignment Due: ${assignment.title}`,
        body: `"${assignment.title}" is due ${dueDate}. Make sure to submit before the deadline.`,
        priority: "high",
        channels: ["in_app", "email"],
        metadata: {
          assignmentId: assignment.id,
          url: `/assignments/${assignment.id}`,
        },
        lang: assignment.school?.preferredLanguage ?? "ar",
        targetScope: "class",
        targetClassId: assignment.classId,
      })
      totalCreated += created
    }

    return NextResponse.json({
      success: true,
      assignments: upcomingAssignments.length,
      notificationsCreated: totalCreated,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[assignment-reminders] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
