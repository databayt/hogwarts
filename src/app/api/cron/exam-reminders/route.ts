// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Upcoming Exam Reminders
 *
 * Sends notification reminders for exams scheduled within the next 24 hours.
 *
 * TRIGGER: Daily at 7:00 AM (0 7 * * *)
 *
 * EXECUTION FLOW:
 * 1. Verify CRON_SECRET authorization (isAuthorizedCron — fails closed)
 * 2. Find all PLANNED or IN_PROGRESS exams with examDate in the next 24 hours
 * 3. Dispatch in-app + email notifications to the exam's class audience
 * 4. Return { remindersSent, examsProcessed }
 *
 * TARGETING:
 * - Scoped to class: notifies all students/teachers enrolled in the exam's class.
 *
 * IDEMPOTENCY:
 * - This cron runs once per day (0 7 * * *). The query window is exactly
 *   "now → now+24h", so each exam is captured at most once per calendar day.
 *   No schema flag is required — the tight window + daily cadence is sufficient.
 *   Cross-school: iterates ALL schools (no schoolId filter on the outer query)
 *   and dispatches each reminder scoped to its own schoolId.
 */

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"

export async function GET(request: Request) {
  if (!isAuthorizedCron(request, "exam-reminders")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Cross-school query — no schoolId filter; we scope per exam below.
    const upcomingExams = await db.schoolExam.findMany({
      where: {
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        examDate: {
          gte: now,
          lte: in24h,
        },
      },
      select: {
        id: true,
        schoolId: true,
        title: true,
        classId: true,
        examDate: true,
        startTime: true,
        school: {
          select: { preferredLanguage: true },
        },
      },
    })

    let remindersSent = 0

    for (const exam of upcomingExams) {
      const examDateStr = new Date(exam.examDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      const { created } = await dispatchNotificationsToAudience({
        schoolId: exam.schoolId,
        type: "event_reminder",
        title: `Reminder: ${exam.title}`,
        body: `${exam.title} is on ${examDateStr} at ${exam.startTime}`,
        channels: ["in_app", "email"],
        metadata: {
          entityType: "exam",
          entityId: exam.id,
          url: `/exams/${exam.id}`,
        },
        lang: exam.school?.preferredLanguage ?? "ar",
        targetScope: "class",
        targetClassId: exam.classId,
      })

      remindersSent += created

      console.log(
        JSON.stringify({
          action: "exam_reminder_sent",
          examId: exam.id,
          schoolId: exam.schoolId,
          classId: exam.classId,
          examDate: exam.examDate,
          notificationsCreated: created,
        })
      )
    }

    return NextResponse.json({
      success: true,
      examsProcessed: upcomingExams.length,
      remindersSent,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] exam-reminders failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
