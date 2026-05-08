// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { canAccessStudent } from "../../lib/student-access"

/**
 * GET /api/mobile/attendance/badges — list attendance badges
 *
 * Query params:
 *   student_id — if provided, include earned status per badge for that student
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id") || undefined

    // If a student is targeted, verify the caller is allowed to see their badges.
    if (studentId) {
      const allowed = await canAccessStudent(auth, studentId)
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const badges = await db.attendanceBadge.findMany({
      where: {
        schoolId: auth.schoolId,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        pointValue: true,
        studentBadges: studentId
          ? {
              where: { studentId },
              select: { awardedAt: true },
              take: 1,
            }
          : false,
      },
    })

    const data = badges.map((b) => {
      const earned =
        studentId &&
        Array.isArray(b.studentBadges) &&
        b.studentBadges.length > 0
          ? b.studentBadges[0]
          : null

      return {
        id: b.id,
        code: b.code,
        name: b.name,
        description: b.description,
        icon: b.icon,
        color: b.color,
        point_value: b.pointValue,
        is_earned: !!earned,
        earned_at: earned?.awardedAt?.toISOString() || null,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile badges error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
