// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/teacher/schedule — teacher's timetable entries
 *
 * Returns the authenticated teacher's schedule for the current term.
 * Query param: day (0-6, optional — defaults to all days)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Find the teacher record linked to this user
    const teacher = await db.teacher.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const dayParam = searchParams.get("day")
    const day = dayParam !== null ? parseInt(dayParam) : undefined

    const where: Record<string, unknown> = {
      schoolId: auth.schoolId,
      teacherId: teacher.id,
    }

    if (day !== undefined) {
      where.dayOfWeek = day
    }

    const slots = await db.timetable.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { period: { startTime: "asc" } }],
      select: {
        id: true,
        dayOfWeek: true,
        subject: { select: { id: true, name: true } },
        section: {
          select: { id: true, name: true, grade: { select: { name: true } } },
        },
        classroom: { select: { id: true, roomName: true } },
        period: {
          select: { id: true, name: true, startTime: true, endTime: true },
        },
      },
    })

    const data = slots.map((s) => ({
      id: s.id,
      day_of_week: s.dayOfWeek,
      subject_name: s.subject?.name || null,
      section_name: s.section?.name || null,
      grade_name: s.section?.grade?.name || null,
      classroom: s.classroom?.roomName || null,
      period_name: s.period?.name || null,
      start_time: s.period?.startTime || null,
      end_time: s.period?.endTime || null,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile teacher schedule error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
