// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/timetable/:userId — timetable for a user
 *
 * For students: returns timetable for their section.
 * For teachers: returns their teaching schedule.
 * Query param: day (0-6, optional — defaults to all days)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const dayParam = searchParams.get("day")
    const day = dayParam !== null ? parseInt(dayParam) : undefined

    // Determine if student or teacher
    const [student, teacher] = await Promise.all([
      db.student.findFirst({
        where: { userId, schoolId: auth.schoolId },
        select: { id: true, sectionId: true },
      }),
      db.teacher.findFirst({
        where: { userId, schoolId: auth.schoolId },
        select: { id: true },
      }),
    ])

    let where: Record<string, unknown> = { schoolId: auth.schoolId }

    if (student?.sectionId) {
      where.sectionId = student.sectionId
    } else if (teacher) {
      where.teacherId = teacher.id
    } else {
      return NextResponse.json({ data: [] })
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
        teacher: { select: { id: true, firstName: true, lastName: true } },
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
      teacher_name: s.teacher
        ? [s.teacher.firstName, s.teacher.lastName].filter(Boolean).join(" ")
        : null,
      section_name: s.section?.name || null,
      grade_name: s.section?.grade?.name || null,
      classroom: s.classroom?.roomName || null,
      period_name: s.period?.name || null,
      start_time: s.period?.startTime || null,
      end_time: s.period?.endTime || null,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile timetable error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
