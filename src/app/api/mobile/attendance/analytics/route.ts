// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/attendance/analytics — attendance analytics
 *
 * Query params:
 *   start_date — filter from date (ISO string)
 *   end_date   — filter to date (ISO string)
 *   student_id — specific student (optional, aggregates school-wide if omitted)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    // Authorization: matches central attendance permission matrix (view_analytics).
    // STAFF added; "SUPER_ADMIN" is dead code → "DEVELOPER".
    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "STAFF" &&
      auth.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date") || undefined
    const endDate = searchParams.get("end_date") || undefined
    const studentId = searchParams.get("student_id") || undefined

    const where = {
      schoolId: auth.schoolId,
      deletedAt: null,
      ...(studentId ? { studentId } : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    }

    const [totalDays, presentCount, absentCount, lateCount, excusedCount] =
      await Promise.all([
        db.attendance.count({ where }),
        db.attendance.count({ where: { ...where, status: "PRESENT" } }),
        db.attendance.count({ where: { ...where, status: "ABSENT" } }),
        db.attendance.count({ where: { ...where, status: "LATE" } }),
        db.attendance.count({ where: { ...where, status: "EXCUSED" } }),
      ])

    // Build daily trend data
    const records = await db.attendance.findMany({
      where,
      orderBy: { date: "asc" },
      select: { date: true, status: true },
    })

    const trendMap = new Map<
      string,
      { present: number; absent: number; late: number }
    >()
    for (const r of records) {
      const key = r.date.toISOString().split("T")[0]
      if (!trendMap.has(key)) {
        trendMap.set(key, { present: 0, absent: 0, late: 0 })
      }
      const entry = trendMap.get(key)!
      if (r.status === "PRESENT") entry.present++
      else if (r.status === "ABSENT") entry.absent++
      else if (r.status === "LATE") entry.late++
    }

    const trend = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
    }))

    const attendanceRate =
      totalDays > 0 ? Math.round((presentCount / totalDays) * 1000) / 10 : 0

    return NextResponse.json({
      total_days: totalDays,
      present_count: presentCount,
      absent_count: absentCount,
      late_count: lateCount,
      excused_count: excusedCount,
      attendance_rate: attendanceRate,
      trend,
    })
  } catch (error) {
    console.error("Mobile analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
