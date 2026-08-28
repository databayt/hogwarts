// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live-class → attendance bridge. When a conference ends, mark each section
// student PRESENT/LATE from their LiveKit participant presence, and ABSENT for
// roster students who never joined.
//
// NOT a "use server" action — invoked internally from the LiveKit webhook
// (room_finished) and the stale-session cleanup cron. System context: there is
// no auth()/session here, so `markedBy` is null and the section roster is the
// authority for who *should* have attended.
//
// LiveKit-only by nature: external pasted-link sessions emit no participant
// telemetry, so there is no presence to read and this is a no-op for them.
// Gated per-school by `School.conferenceAttendanceSync` (opt-in) — attendance
// is sensitive, so it is never auto-written without an explicit toggle.
//
// Idempotent: keyed on the section-based unique tuple
// (schoolId, studentId, sectionId, date, periodId); re-running updates in place
// and revives a soft-deleted row (mirrors markPeriodAttendance).

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// Minutes after the scheduled start beyond which a join counts as LATE.
const LATE_GRACE_MINUTES = 10

/**
 * Minutes a student must actually be in the room before it counts as attending.
 *
 * Presence used to be binary on `joinedAt`: connect for five seconds, get marked
 * PRESENT for the period, identically to a student who sat the whole lesson.
 * `leftAt` and `durationSeconds` were written by the webhook and never read.
 *
 * Named rather than inlined because a school will eventually want to set it.
 */
const MIN_PRESENCE_MINUTES = 5

export async function syncConferenceAttendance(
  schoolId: string,
  sessionId: string
): Promise<{ marked: number; updated: number; skipped?: string }> {
  try {
    const session = await db.conference.findFirst({
      where: { id: sessionId, schoolId },
      select: {
        id: true,
        provider: true,
        sectionId: true,
        timetableId: true,
        scheduledStart: true,
        scheduledEnd: true,
        actualStart: true,
        school: { select: { conferenceAttendanceSync: true } },
      },
    })
    if (!session) return { marked: 0, updated: 0, skipped: "session_not_found" }
    if (!session.school.conferenceAttendanceSync) {
      return { marked: 0, updated: 0, skipped: "disabled" }
    }
    // Hard provider guard, not just "external never ends": an external
    // session carries NO participant telemetry, so syncing one would mark the
    // entire roster ABSENT. If an external row ever reaches `ended` (manual
    // status edit + the stale-session cron), this must stay a no-op.
    if (session.provider !== "livekit") {
      return { marked: 0, updated: 0, skipped: "external_provider" }
    }
    // Need a section (roster) AND a timetable slot (→ periodId) so the
    // section-based unique key dedupes properly. Ad-hoc sessions don't sync.
    if (!session.sectionId || !session.timetableId) {
      return { marked: 0, updated: 0, skipped: "no_section_or_timetable" }
    }
    const sectionId = session.sectionId
    const timetableId = session.timetableId

    const slot = await db.timetable.findFirst({
      where: { id: timetableId, schoolId },
      select: { periodId: true, period: { select: { name: true } } },
    })
    if (!slot?.periodId) return { marked: 0, updated: 0, skipped: "no_period" }
    const periodId = slot.periodId
    const periodName = slot.period?.name ?? null

    // Roster = every student placed in the section (id + userId for the
    // presence map). This is the authority for who should have attended.
    const roster = await db.student.findMany({
      where: { schoolId, sectionId },
      select: { id: true, userId: true },
    })
    if (roster.length === 0) {
      return { marked: 0, updated: 0, skipped: "empty_roster" }
    }

    // Presence: PARTICIPANT (student) rows for this session, keyed by userId.
    // ConferenceParticipant is unique on (sessionId, userId), so one row each.
    const participants = await db.conferenceParticipant.findMany({
      where: { sessionId, schoolId, role: "PARTICIPANT" },
      select: { userId: true, joinedAt: true, leftAt: true },
    })
    const presenceByUser = new Map<
      string,
      { joinedAt: Date | null; leftAt: Date | null }
    >()
    for (const p of participants) {
      presenceByUser.set(p.userId, { joinedAt: p.joinedAt, leftAt: p.leftAt })
    }

    const start = session.actualStart ?? session.scheduledStart
    const lateAfter = new Date(start.getTime() + LATE_GRACE_MINUTES * 60_000)
    // Attendance.date is @db.Date — use UTC midnight of the session day so the
    // unique key is stable regardless of the start time of day.
    const dateObj = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
    )

    // A student still in the room when it closes may have no `leftAt` at all:
    // the webhook writes it on `participant_left`, the sync runs from
    // `room_finished`, and the two events have no guaranteed order. So an
    // unset `leftAt` is read as "stayed until the session ended", NOT as a
    // zero-length visit — otherwise the floor below would mark the student who
    // sat through the whole lesson absent, and only the ones who left early
    // present. `durationSeconds` has the same hazard and is deliberately not
    // used as the source here.
    const sessionEnd = session.scheduledEnd ?? new Date()
    const attended = (joinedAt: Date, leftAt: Date | null): boolean => {
      const end = leftAt ?? sessionEnd
      const minutes = (end.getTime() - joinedAt.getTime()) / 60_000
      return minutes >= MIN_PRESENCE_MINUTES
    }

    const studentIds = roster.map((s) => s.id)
    // Prefetch existing rows in one query (no per-student findFirst N+1).
    const existingRows = await db.attendance.findMany({
      where: {
        schoolId,
        sectionId,
        date: dateObj,
        periodId,
        studentId: { in: studentIds },
      },
      select: { id: true, studentId: true },
    })
    const existingByStudent = new Map(
      existingRows.map((r) => [r.studentId, r.id])
    )

    let marked = 0
    let updated = 0
    await db.$transaction(async (tx) => {
      const toCreate: Prisma.AttendanceCreateManyInput[] = []

      for (const student of roster) {
        // A join that LASTED → PRESENT (LATE past the grace window). No
        // participant row, no recorded join, or a join too short to count →
        // ABSENT.
        const presence = student.userId
          ? (presenceByUser.get(student.userId) ?? null)
          : null
        const joinedAt = presence?.joinedAt ?? null
        let status: "PRESENT" | "ABSENT" | "LATE" = "ABSENT"
        let checkInTime: Date | null = null
        if (joinedAt && attended(joinedAt, presence?.leftAt ?? null)) {
          checkInTime = joinedAt
          status = joinedAt.getTime() > lateAfter.getTime() ? "LATE" : "PRESENT"
        }

        const existingId = existingByStudent.get(student.id)
        if (existingId) {
          await tx.attendance.update({
            where: { id: existingId },
            data: {
              status,
              method: "VIRTUAL",
              markedAt: new Date(),
              deletedAt: null, // revive a soft-deleted row on re-sync
              ...(checkInTime ? { checkInTime } : {}),
            },
          })
          updated++
        } else {
          toCreate.push({
            schoolId,
            studentId: student.id,
            date: dateObj,
            status,
            method: "VIRTUAL",
            periodId,
            periodName,
            timetableId,
            sectionId,
            markedBy: null,
            checkInTime,
            notes: "auto: live-class presence",
          })
          marked++
        }
      }

      if (toCreate.length > 0) {
        await tx.attendance.createMany({ data: toCreate })
      }
    })

    return { marked, updated }
  } catch (err) {
    console.error("[conference] syncConferenceAttendance failed", {
      schoolId,
      sessionId,
      err: err instanceof Error ? err.message : err,
    })
    return { marked: 0, updated: 0, skipped: "error" }
  }
}

/**
 * Why a session will — or will not — have its attendance written from
 * presence. The exact conditions `syncConferenceAttendance` checks above,
 * factored out so the session detail page can TELL the teacher instead of
 * leaving them to discover it after the class.
 *
 * This matters most in the case the block was extended for: a school that goes
 * online in an emergency runs on external links (the SFU is not provisioned),
 * and an external meeting emits no presence at all. Silence there reads as
 * "attendance is handled" right up until the register is empty.
 */
export type AttendanceSyncReason =
  | "auto"
  | "disabled"
  | "external_provider"
  | "no_section_or_timetable"

export function describeAttendanceSync(
  session: {
    provider: string
    sectionId: string | null
    timetableId: string | null
  },
  syncEnabled: boolean
): AttendanceSyncReason {
  if (!syncEnabled) return "disabled"
  if (session.provider !== "livekit") return "external_provider"
  if (!session.sectionId || !session.timetableId) {
    return "no_section_or_timetable"
  }
  return "auto"
}
