// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
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
 * For students: returns timetable for their section.
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

    // Wave 1 — everything that needs only the caller's school and the :userId.
    // The term, the school's zone and the name format are read here, beside the
    // student/teacher lookup, rather than after the slots: they were three more
    // sequential round trips. The term and the zone only serve the best-effort
    // live-class step, so a failure there must not fail the request.
    const [student, teacher, termResult, school, nameDisplay] =
      await Promise.all([
        db.student.findFirst({
          where: { userId, schoolId: auth.schoolId },
          select: { id: true, sectionId: true },
        }),
        db.teacher.findFirst({
          where: { userId, schoolId: auth.schoolId },
          select: { id: true },
        }),
        // resolveActiveTerm returns { term, source } — the term itself may be
        // null for a school with no configured academic year.
        resolveActiveTerm(auth.schoolId).catch((err) => {
          console.error("Mobile timetable term resolution failed:", err)
          return null
        }),
        db.school
          .findUnique({
            where: { id: auth.schoolId },
            select: { timezone: true },
          })
          .catch(() => null),
        schoolNameDisplay(auth.schoolId),
      ])

    const where: Record<string, unknown> = { schoolId: auth.schoolId }
    // Resolves to whether the caller may see this timetable.
    let access: Promise<boolean>

    if (student) {
      // Nothing to read for a student with no section yet — but the gate still
      // runs first, so an outsider learns nothing, not even that.
      if (student.sectionId) where.sectionId = student.sectionId
      // Same gate the other eight student-scoped mobile routes use: the student
      // themselves, a guardian linked through StudentGuardian, or staff.
      access = canAccessStudent(auth, student.id)
    } else if (teacher) {
      // A teacher's week is their own to see; staff roles carry `view_all`.
      const isSelf = userId === auth.userId
      const isStaff =
        auth.role === "DEVELOPER" ||
        auth.role === "ADMIN" ||
        auth.role === "STAFF"
      access = Promise.resolve(isSelf || isStaff)
      where.teacherId = teacher.id
    } else {
      return NextResponse.json({ data: [] })
    }

    if (day !== undefined) {
      where.dayOfWeek = day
    }

    // Wave 2 — the access check and the slot read run side by side. The read
    // starts speculatively, but its rows are only ever used once the check has
    // said yes; on a denial they are dropped and nothing of them is returned.
    const hasWeek = !(student && !student.sectionId)
    const slotsRead = hasWeek
      ? db.timetable.findMany({
          where,
          orderBy: [{ dayOfWeek: "asc" }, { period: { startTime: "asc" } }],
          select: {
            id: true,
            dayOfWeek: true,
            subject: { select: { id: true, name: true } },
            teacher: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
              },
            },
            section: {
              select: {
                id: true,
                name: true,
                grade: { select: { name: true } },
              },
            },
            classroom: { select: { id: true, roomName: true } },
            period: {
              select: { id: true, name: true, startTime: true, endTime: true },
            },
          },
        })
      : null
    // If the check throws or says no, nobody awaits the read — keep a failure
    // there from surfacing as an unhandled rejection.
    slotsRead?.catch(() => {})

    if (!(await access)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (!slotsRead) return NextResponse.json({ data: [] })
    const slots = await slotsRead

    // Wave 3 — resolve today's live classes. Mobile previously returned raw
    // slots with no live-class field and had no conference endpoint at all, so
    // a phone could not discover that a class was online — let alone join it.
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
      const term = termResult?.term
      if (term) {
        const now = new Date()
        const timezone = school?.timezone ?? DEFAULT_SCHOOL_TZ
        // The school's weekday, not the server's — a UTC read puts a Sudanese
        // school on the wrong day for the hours either side of midnight.
        const today = schoolDayOfWeek(timezone, now)
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
            })),
            // Already read in wave 1 — saves the helper its own query.
            timezone
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
        teacher_name: s.teacher ? displayName(s.teacher, nameDisplay) : null,
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
