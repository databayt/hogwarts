// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Purge Empty Wizard Drafts
 *
 * Opening "Add student" / "Add teacher" creates the row before the admin types
 * anything. The wizard's Close button discards it when it is still empty, but
 * a closed tab, a lost connection or the browser's Back button never press
 * Close — those rows are what this sweeps.
 *
 * TRIGGER: Daily at 2:00 AM (0 2 * * *), beside cleanup-notifications.
 *
 * RULES:
 * - Only drafts matching EMPTY_STUDENT_DRAFT / EMPTY_TEACHER_DRAFT: no name,
 *   no parent, no document, no phone, no grade… A draft with ANY data stays,
 *   so an admin who got halfway can still resume it.
 * - Only drafts older than 24 hours — someone may have one open right now.
 * - Cross-tenant on purpose (a system sweep, like cleanup-notifications); the
 *   emptiness check is the delete's own WHERE.
 */

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import {
  EMPTY_DRAFT_GRACE_MS,
  EMPTY_STUDENT_DRAFT,
  EMPTY_TEACHER_DRAFT,
} from "@/components/school-dashboard/listings/empty-drafts"

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  const cutoff = new Date(startTime - EMPTY_DRAFT_GRACE_MS)

  try {
    const [students, teachers] = await Promise.all([
      db.student.deleteMany({
        where: { ...EMPTY_STUDENT_DRAFT, createdAt: { lt: cutoff } },
      }),
      db.teacher.deleteMany({
        where: { ...EMPTY_TEACHER_DRAFT, createdAt: { lt: cutoff } },
      }),
    ])

    return NextResponse.json({
      success: true,
      deleted: { students: students.count, teachers: teachers.count },
      durationMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[cron:purge-empty-drafts]", error)
    return NextResponse.json(
      { success: false, error: "Purge failed" },
      { status: 500 }
    )
  }
}
