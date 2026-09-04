// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
} from "@/components/school-dashboard/live/day-window"
import {
  attachLiveClasses,
  type LiveClassJoinInfo,
} from "@/components/school-dashboard/timetable/live-class-join"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { canAccessStudent } from "../../lib/student-access"

/**
 * GET /api/mobile/timetable/:userId — timetable for a user
 *
 * For students: returns timetable for their section AND enrolled classes.
 * For teachers: returns their teaching schedule.
 * Query param: day (0-6, optional — defaults to all days)
 *
 * `:userId` is NOT trusted. It names whose timetable is wanted; the caller
 * still has to be allowed to see it — themselves, a linked guardian, or school
 * staff. Without that check any authenticated pupil could walk the id space and
 * read every classmate's and teacher's week.
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

    const where: Record<string, unknown> = { schoolId: auth.schoolId }

    if (student) {
      // Same gate the other eight student-scoped mobile routes use: the student
      // themselves, a guardian linked through StudentGuardian, or staff.
      if (!(await canAccessStudent(auth, student.id))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // A slot reaches a student down EITHER axis: the section they are placed
      // in, or a legacy per-subject Class they are enrolled in. Reading only
      // `sectionId` returned an EMPTY week for every student whose data predates
      // the section-first migration — the exact failure the block's "reads OR
      // both axes" rule exists to prevent, which the web read already honours.
      const enrollments = await db.studentClass.findMany({
        where: { studentId: student.id, schoolId: auth.schoolId },
        select: { classId: true },
      })
      const classIds = enrollments.map((e) => e.classId)

      const axes: Array<Record<string, unknown>> = []
      if (student.sectionId) axes.push({ sectionId: student.sectionId })
      if (classIds.length > 0) axes.push({ classId: { in: classIds } })
      if (axes.length === 0) return NextResponse.json({ data: [] })
      where.OR = axes
    } else if (teacher) {
      // A teacher's week is their own to see; staff roles carry `view_all`.
      const isSelf = userId === auth.userId
      const isStaff =
        auth.role === "DEVELOPER" ||
        auth.role === "ADMIN" ||
        auth.role === "STAFF"
      if (!isSelf && !isStaff) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
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

    // Resolve today's live classes. Mobile previously returned raw slots with no
    // live-class field and had no conference endpoint at all, so a phone could
    // not discover that a class was online — let alone join it.
    //
    // ONLY today's slots are passed in, and that restriction is load-bearing.
    // `attachLiveClasses` resolves most-specific-first, and only its first tier
    // (an exact `timetableId` match) is day-aware: tier 2 matches any of TODAY's
    // sessions for the same (section, subject), and tier 3 — the standing
    // `ConferenceLink` — carries no day at all. Hand it a whole week, as this
    // route does by default, and Monday's maths row inherits Thursday's session
    // while a standing link stamps every weekday row of that subject. The web
    // callers never hit this because they only ever pass one day.
    //
    // Best-effort: a failure here must still return the timetable, which is
    // what the screen is actually for.
    const live = new Map<string, LiveClassJoinInfo>()
    try {
      // resolveActiveTerm returns { term, source } — the term itself may be null
      // for a school with no configured academic year.
      const [{ term }, school] = await Promise.all([
        resolveActiveTerm(auth.schoolId),
        db.school.findUnique({
          where: { id: auth.schoolId },
          select: { timezone: true },
        }),
      ])
      if (term) {
        const now = new Date()
        // The school's weekday, not the server's — a UTC read puts a Sudanese
        // school on the wrong day for the hours either side of midnight.
        const today = schoolDayOfWeek(
          school?.timezone ?? DEFAULT_SCHOOL_TZ,
          now
        )
        const todaySlots = slots.filter((s) => s.dayOfWeek === today)
        if (todaySlots.length > 0) {
          const attached = await attachLiveClasses(
            auth.schoolId,
            term.id,
            now,
            todaySlots.map((s) => ({
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
