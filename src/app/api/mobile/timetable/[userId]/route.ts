// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  attachLiveClasses,
  type LiveClassJoinInfo,
} from "@/components/school-dashboard/timetable/live-class-join"

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

    // Resolve today's live classes for these slots. Mobile previously returned
    // raw slots with no live-class field and had no conference endpoint at all,
    // so a phone could not discover that a class was online — let alone join it.
    //
    // `attachLiveClasses` is TODAY-scoped by nature (a session exists for a
    // specific date), so a slot on another weekday correctly comes back with
    // `live_class: null`. Best-effort: a failure here must still return the
    // timetable, which is what the screen is actually for.
    const live = new Map<string, LiveClassJoinInfo>()
    try {
      // resolveActiveTerm returns { term, source } — the term itself may be null
      // for a school with no configured academic year.
      const { term } = await resolveActiveTerm(auth.schoolId)
      if (term) {
        const attached = await attachLiveClasses(
          auth.schoolId,
          term.id,
          new Date(),
          slots.map((s) => ({
            timetableId: s.id,
            sectionId: s.section?.id ?? null,
            subjectId: s.subject?.id ?? null,
          }))
        )
        for (const row of attached) {
          if (row.liveClass && row.timetableId) {
            live.set(row.timetableId, row.liveClass)
          }
        }
      }
    } catch (err) {
      console.error("Mobile timetable live-class resolution failed:", err)
    }

    const data = slots.map((s) => {
      const lc = live.get(s.id) ?? null
      return {
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
        // null when this slot is not online today.
        live_class: lc
          ? {
              session_id: lc.sessionId,
              provider: lc.provider,
              // External sessions are joined by opening this URL; a LiveKit
              // session is joined through /api/mobile/conference/{id}/join.
              meeting_url: lc.meetingUrl,
              status: lc.status,
            }
          : null,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile timetable error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
