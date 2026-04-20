// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

/**
 * GET /api/mobile/guardian/children/:childId/timetable — child timetable
 *
 * Verifies guardian relationship before returning data.
 * Returns timetable slots for the child's section.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { childId } = await params

    // Verify guardian relationship
    const guardian = await db.guardian.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!guardian) {
      return NextResponse.json({ error: "Not a guardian" }, { status: 403 })
    }

    const link = await db.studentGuardian.findFirst({
      where: {
        guardianId: guardian.id,
        studentId: childId,
        schoolId: auth.schoolId,
      },
      select: { id: true },
    })

    if (!link) {
      return NextResponse.json(
        { error: "Not authorized for this child" },
        { status: 403 }
      )
    }

    // Get the child's section
    const student = await db.student.findFirst({
      where: { id: childId, schoolId: auth.schoolId },
      select: { sectionId: true },
    })

    if (!student?.sectionId) {
      return NextResponse.json({ data: [] })
    }

    const { searchParams } = new URL(request.url)
    const dayParam = searchParams.get("day")
    const day = dayParam !== null ? parseInt(dayParam) : undefined

    const where: Record<string, unknown> = {
      schoolId: auth.schoolId,
      sectionId: student.sectionId,
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
    console.error("Mobile guardian child timetable error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
