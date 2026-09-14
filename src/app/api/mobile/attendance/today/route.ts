// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import {
  loadAttendanceFollowUp,
  loadTodaysAttendanceDashboard,
} from "@/components/school-dashboard/attendance/queries"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { hasRole } from "../../lib/roles"

/**
 * GET /api/mobile/attendance/today — the web attendance overview for the day
 *
 * ADMIN / STAFF / DEVELOPER only. Reads the same loaders as the web overview
 * (`getTodaysDashboard` + `getFollowUpStudents`, via attendance/queries.ts):
 * classes-marked progress, the unmarked class pills, needs-attention rows and
 * the last ten marks. Query: `limit` for needs_attention (1–20, default 5 like
 * the web card).
 *
 * Returns {
 *   today { date, day_name, is_school_day },
 *   stats { total_students, marked_today, present, absent, late,
 *           attendance_rate, classes_total, classes_marked },
 *   unmarked_classes [{ id, name, student_count }],
 *   needs_attention [{ student_id, student_name, class_name, issue, severity,
 *                      details, count, date, action_url }],
 *   needs_attention_summary { critical, warning, info },
 *   recent_activity [{ id, student_name, class_name, status, method, date,
 *                      time, marked_at }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (!hasRole(auth, "ADMIN", "STAFF", "DEVELOPER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const limitParam = Number(
      new URL(request.url).searchParams.get("limit") ?? 5
    )
    const limit = Number.isFinite(limitParam)
      ? Math.min(20, Math.max(1, Math.trunc(limitParam)))
      : 5

    const viewer = {
      schoolId: auth.schoolId,
      userId: auth.userId,
      role: auth.role,
    }
    const [day, followUp] = await Promise.all([
      loadTodaysAttendanceDashboard(viewer),
      loadAttendanceFollowUp({ ...viewer, limit }),
    ])

    return NextResponse.json(
      {
        today: {
          date: day.today.date,
          day_name: day.today.dayName,
          is_school_day: day.today.isSchoolDay,
        },
        stats: {
          total_students: day.stats.totalStudents,
          marked_today: day.stats.markedToday,
          present: day.stats.present,
          absent: day.stats.absent,
          late: day.stats.late,
          attendance_rate: day.stats.attendanceRate,
          classes_total: day.stats.classesTotal,
          classes_marked: day.stats.classesMarked,
        },
        unmarked_classes: day.unmarkedClasses.map((c) => ({
          id: c.id,
          name: c.name,
          student_count: c.studentCount,
        })),
        needs_attention: followUp.students.map((s) => ({
          student_id: s.studentId,
          student_name: s.studentName,
          class_name: s.className,
          issue: s.issue,
          severity: s.severity,
          details: s.details,
          count: s.count ?? null,
          date: s.date ?? null,
          action_url: s.actionUrl ?? null,
        })),
        needs_attention_summary: followUp.summary,
        recent_activity: day.recentActivity.map((a) => ({
          id: a.id,
          student_name: a.studentName,
          class_name: a.className,
          status: a.status,
          method: a.method,
          date: a.date,
          time: a.time,
          marked_at: a.markedAt,
        })),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    console.error("Mobile attendance today error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
