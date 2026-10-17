// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import type { AttendanceStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { displayName, type NameDisplay } from "@/lib/name-utils"

import { connectedSeconds } from "./actions/attendance-sync"
import { DEFAULT_SCHOOL_TZ, schoolDayOfInstant } from "./day-window"

export interface AttendanceReviewViewer {
  userId: string | null | undefined
  role: string | null | undefined
  schoolId: string | null | undefined
}

export interface AttendanceReviewRow {
  studentId: string
  name: string
  joinedAt: Date | null
  leftAt: Date | null
  /** Whole minutes connected across reconnects; 0 when never joined. */
  minutes: number
  /** The period's attendance row, if one exists (manual or VIRTUAL). */
  status: AttendanceStatus | null
  method: string | null
}

/** Roles that can override through `markPeriodAttendance`. */
const EDIT_ROLES = ["ADMIN", "TEACHER"]

/**
 * The class page's after-class register: who joined, for how long, and what
 * the period's attendance now says — for the host and the school's admins.
 * `null` for everyone else, for a class with no section, and before the class
 * has run.
 *
 * Reads only. The override goes through the attendance block's own
 * `markPeriodAttendance` (actions/attendance-review.ts), so a corrected mark is
 * a MANUAL row with `markedBy`, the same as one made in the register.
 */
export async function loadAttendanceReview(
  sessionId: string,
  viewer: AttendanceReviewViewer,
  nameDisplay?: NameDisplay
) {
  const { schoolId, userId, role } = viewer
  if (!schoolId || !userId || !role) return null

  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId, deletedAt: null },
    select: {
      id: true,
      status: true,
      provider: true,
      sectionId: true,
      timetableId: true,
      scheduledStart: true,
      actualStart: true,
      teacher: { select: { userId: true } },
      school: { select: { timezone: true } },
    },
  })
  if (!session?.sectionId) return null
  if (session.status !== "live" && session.status !== "ended") return null

  const isHost = role === "TEACHER" && session.teacher?.userId === userId
  const isAdmin = role === "ADMIN" || role === "DEVELOPER"
  if (!isHost && !isAdmin) return null

  const sectionId = session.sectionId
  const start = session.actualStart ?? session.scheduledStart
  const date = schoolDayOfInstant(
    session.school.timezone ?? DEFAULT_SCHOOL_TZ,
    start
  )

  const slot = session.timetableId
    ? await db.timetable.findFirst({
        where: { id: session.timetableId, schoolId },
        select: { periodId: true },
      })
    : null
  const periodId = slot?.periodId ?? null

  const [roster, participants] = await Promise.all([
    db.student.findMany({
      where: { schoolId, sectionId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        middleName: true,
        lastName: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    db.conferenceParticipant.findMany({
      where: { sessionId, schoolId, role: "PARTICIPANT" },
      select: {
        userId: true,
        joinedAt: true,
        leftAt: true,
        durationSeconds: true,
        activeSince: true,
      },
    }),
  ])

  const marks = periodId
    ? await db.attendance.findMany({
        where: {
          schoolId,
          sectionId,
          date: new Date(date),
          periodId,
          studentId: { in: roster.map((s) => s.id) },
          deletedAt: null,
        },
        select: { studentId: true, status: true, method: true },
      })
    : []
  const markByStudent = new Map(marks.map((m) => [m.studentId, m]))
  const presenceByUser = new Map(participants.map((p) => [p.userId, p]))

  const now = new Date()
  const rows: AttendanceReviewRow[] = roster.map((s) => {
    const p = s.userId ? presenceByUser.get(s.userId) : undefined
    const mark = markByStudent.get(s.id)
    return {
      studentId: s.id,
      name: displayName(s, nameDisplay),
      joinedAt: p?.joinedAt ?? null,
      leftAt: p?.activeSince ? null : (p?.leftAt ?? null),
      minutes: p ? Math.floor(connectedSeconds(p, now) / 60) : 0,
      status: mark?.status ?? null,
      method: mark?.method ?? null,
    }
  })

  return {
    sessionId: session.id,
    sectionId,
    date,
    periodId,
    timetableId: session.timetableId,
    // Only a LiveKit room reports presence; an external meeting's minutes
    // would all read zero.
    hasPresence: session.provider === "livekit",
    emptyRoom: !rows.some((r) => r.joinedAt),
    canEdit: periodId != null && EDIT_ROLES.includes(role),
    rows,
  }
}

export type AttendanceReview = NonNullable<
  Awaited<ReturnType<typeof loadAttendanceReview>>
>
