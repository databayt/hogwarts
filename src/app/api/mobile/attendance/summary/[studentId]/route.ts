// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"
import { canAccessStudent } from "../../../lib/student-access"

/**
 * GET /api/mobile/attendance/summary/:studentId — attendance summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { studentId } = await params

    // Relationship gate: only staff, the student themselves, or their
    // guardian may read this student's summary.
    const allowed = await canAccessStudent(auth, studentId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [total, present, absent, late, excused] = await Promise.all([
      db.attendance.count({
        where: { schoolId: auth.schoolId, studentId, deletedAt: null },
      }),
      db.attendance.count({
        where: {
          schoolId: auth.schoolId,
          studentId,
          status: "PRESENT",
          deletedAt: null,
        },
      }),
      db.attendance.count({
        where: {
          schoolId: auth.schoolId,
          studentId,
          status: "ABSENT",
          deletedAt: null,
        },
      }),
      db.attendance.count({
        where: {
          schoolId: auth.schoolId,
          studentId,
          status: "LATE",
          deletedAt: null,
        },
      }),
      db.attendance.count({
        where: {
          schoolId: auth.schoolId,
          studentId,
          status: "EXCUSED",
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      total,
      present,
      absent,
      late,
      excused,
      percentage: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
    })
  } catch (error) {
    console.error("Mobile attendance summary error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
