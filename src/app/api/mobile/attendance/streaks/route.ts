// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { canAccessStudent } from "../../lib/student-access"

/**
 * GET /api/mobile/attendance/streaks — get attendance streak data
 *
 * Query params:
 *   student_id — specific student (optional, defaults to auth user's linked student)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    let studentId = searchParams.get("student_id") || undefined

    // If no student_id provided, try to find student linked to auth user
    if (!studentId) {
      const student = await db.student.findFirst({
        where: { schoolId: auth.schoolId, userId: auth.userId },
        select: { id: true },
      })
      if (student) studentId = student.id
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "student_id required" },
        { status: 400 }
      )
    }

    // Relationship gate
    const allowed = await canAccessStudent(auth, studentId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const streak = await db.attendanceStreak.findUnique({
      where: {
        schoolId_studentId: {
          schoolId: auth.schoolId,
          studentId,
        },
      },
      select: {
        currentStreak: true,
        longestStreak: true,
        streakStartDate: true,
        lastPresentDate: true,
        monthlyPresent: true,
        monthlyLate: true,
        monthlyAbsent: true,
      },
    })

    return NextResponse.json({
      current_streak: streak?.currentStreak ?? 0,
      longest_streak: streak?.longestStreak ?? 0,
      streak_start_date: streak?.streakStartDate?.toISOString() || null,
      last_present_date: streak?.lastPresentDate?.toISOString() || null,
      monthly_present: streak?.monthlyPresent ?? 0,
      monthly_late: streak?.monthlyLate ?? 0,
      monthly_absent: streak?.monthlyAbsent ?? 0,
    })
  } catch (error) {
    console.error("Mobile streaks error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
