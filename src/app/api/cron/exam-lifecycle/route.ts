// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Cron — advance scheduled exams through their lifecycle.
 *
 * Schedule: every 15 minutes (see vercel.json).
 *  - OPEN:  PLANNED exams whose scheduled start (examDate + startTime) has
 *           arrived and whose end has not passed → IN_PROGRESS (students can
 *           now take them).
 *  - CLOSE: IN_PROGRESS exams whose end (examDate + endTime + lateSubmitMinutes)
 *           has passed → COMPLETED (ready for the one-click "auto-mark & publish";
 *           fully-objective papers were already graded per-student on submit).
 *
 * We do NOT finalize/mark here — the marking stack is auth-scoped by tenant and
 * has no session in a cron. Objective results land instantly on submit; exams
 * with subjective questions surface as COMPLETED for the one-click AI finalize.
 *
 * Times: examDate is a DATETIME; startTime/endTime are "HH:MM" strings applied
 * with setHours — mirrors `exams/lib/security.ts` so the window matches the
 * student-facing access check exactly.
 *
 * Auth: shared CRON_SECRET bearer via `@/lib/cron-auth`.
 */

function combine(examDate: Date, time: string | null): Date | null {
  if (!time) return null
  const [h, m] = time.split(":").map(Number)
  if (Number.isNaN(h)) return null
  const d = new Date(examDate)
  d.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0)
  return d
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request, "exam-lifecycle")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const now = new Date()
    // Bound the scan: exams scheduled from a week ago through tomorrow.
    const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const candidates = await db.schoolExam.findMany({
      where: {
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        examDate: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        schoolId: true,
        examDate: true,
        startTime: true,
        endTime: true,
        lateSubmitMinutes: true,
        status: true,
      },
    })

    const toOpen: string[] = []
    const toClose: string[] = []

    for (const exam of candidates) {
      const start = combine(exam.examDate, exam.startTime)
      const end = combine(exam.examDate, exam.endTime)
      const graceMs = (exam.lateSubmitMinutes || 0) * 60 * 1000
      const closesAt = end ? new Date(end.getTime() + graceMs) : null

      if (exam.status === "PLANNED") {
        // Open only if we're inside the window (started, not yet ended).
        if (start && now >= start && (!closesAt || now < closesAt)) {
          toOpen.push(exam.id)
        }
      } else if (exam.status === "IN_PROGRESS") {
        if (closesAt && now > closesAt) {
          toClose.push(exam.id)
        }
      }
    }

    let opened = 0
    let closed = 0
    if (toOpen.length > 0) {
      const r = await db.schoolExam.updateMany({
        where: { id: { in: toOpen }, status: "PLANNED" },
        data: { status: "IN_PROGRESS" },
      })
      opened = r.count
    }
    if (toClose.length > 0) {
      const r = await db.schoolExam.updateMany({
        where: { id: { in: toClose }, status: "IN_PROGRESS" },
        data: { status: "COMPLETED" },
      })
      closed = r.count
    }

    console.log(
      JSON.stringify({
        action: "exam_lifecycle",
        scanned: candidates.length,
        opened,
        closed,
        durationMs: Date.now() - startedAt,
      })
    )

    return NextResponse.json({
      success: true,
      scanned: candidates.length,
      opened,
      closed,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] exam-lifecycle failed:", error)
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
