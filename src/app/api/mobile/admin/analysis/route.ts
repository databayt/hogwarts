// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { adminReadinessOverview } from "@/components/school-dashboard/dashboard/queries"
import { classAttendanceRate } from "@/components/school-dashboard/school/readiness/attendance"
import { attentionList } from "@/components/school-dashboard/school/readiness/overview"
import { loadMemberReadiness } from "@/components/school-dashboard/school/readiness/queries"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { hasRole } from "../../lib/roles"

/**
 * GET /api/mobile/admin/analysis — the school's analysis (progress) report.
 *
 * ADMIN / DEVELOPER only. Reuses the web dashboard's readers: the 7-day
 * attendance + join-channel charts, the 14-day attendance rate, the platform
 * readiness percentage and the follow-up list. Reasons are codes — the app
 * maps them to words.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    if (!hasRole(auth, "ADMIN", "DEVELOPER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const now = new Date()
    const [overview, rate, rows] = await Promise.all([
      adminReadinessOverview(auth.schoolId),
      classAttendanceRate(auth.schoolId, 14, now),
      loadMemberReadiness(auth.schoolId, { now }),
    ])

    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
    return NextResponse.json({
      attendanceRate14d: rate.rate,
      readinessPct: overview.readinessPercent ?? 0,
      attendanceByDay: overview.attendance.map((d) => ({
        date: d.date,
        joined: d.joined,
        expected: d.expected,
      })),
      joinsByDay: overview.joinsByDay.map((d) => ({
        date: d.date,
        app: d.app,
        androidWeb: d.androidWeb,
        computer: d.desktop,
      })),
      needsAttention: attentionList(rows, 15).map((m) => ({
        userId: m.userId,
        name: m.name,
        role: m.role,
        sectionName: m.sectionName,
        level: m.level,
        reasons: m.reasons,
      })),
      counts: {
        members: rows.length,
        onApp: rows.filter((r) => r.device.client === "app").length,
        pushOn: rows.filter((r) => r.pushOn).length,
        active7d: rows.filter(
          (r) => r.lastSeenAt && r.lastSeenAt.getTime() >= weekAgo
        ).length,
      },
    })
  } catch (error) {
    console.error("Mobile admin analysis error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
