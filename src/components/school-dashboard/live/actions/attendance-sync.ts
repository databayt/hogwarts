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

import { DEFAULT_SCHOOL_TZ, schoolDayOfInstant } from "../day-window"

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

/** Minutes before the scheduled end within which leaving still counts as staying. */
const EARLY_LEAVE_MINUTES = 10

type Presence = {
  joinedAt: Date | null
  leftAt: Date | null
  durationSeconds: number | null
  activeSince: Date | null
}

/**
 * Seconds actually connected, across reconnects.
 *
 * The webhook accumulates closed spans into `durationSeconds` and marks the
 * open one with `activeSince`; an open span is counted up to `now`, so the
 * student who stayed to the very end — the one most likely to still be
 * connected when `room_finished` fires — is never scored as absent.
 *
 * LEGACY rows (written before spans existed, including the seeded demo
 * history) carry only `joinedAt`/`leftAt`: `durationSeconds` may be null and
 * `activeSince` is never set. Those fall back to the single span, exactly as
 * before — a null `leftAt` there still means "stayed until reconciliation".
 */
export function connectedSeconds(p: Presence, now: Date): number {
  if (p.durationSeconds != null || p.activeSince) {
    const closed = p.durationSeconds ?? 0
    const open = p.activeSince
      ? Math.max(0, (now.getTime() - p.activeSince.getTime()) / 1000)
      : 0
    return Math.floor(closed + open)
  }
  if (!p.joinedAt) return 0
  const end = p.leftAt ?? now
  return Math.max(0, Math.floor((end.getTime() - p.joinedAt.getTime()) / 1000))
}

export async function syncLiveAttendance(
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
        school: {
          select: {
            timezone: true,
            conferenceAttendanceSync: true,
            conferenceLateGraceMinutes: true,
            conferenceMinPresenceMinutes: true,
            conferenceEarlyLeaveMinutes: true,
          },
        },
      },
    })
    if (!session) return { marked: 0, updated: 0, skipped: "session_not_found" }
    if (!session.school.conferenceAttendanceSync) {
      return { marked: 0, updated: 0, skipped: "disabled" }
    }
    // Per-school thresholds; the constants remain the defaults for any row
    // (or test fixture) that predates the columns.
    const lateGraceMin =
      session.school.conferenceLateGraceMinutes ?? LATE_GRACE_MINUTES
    const minPresenceMin =
      session.school.conferenceMinPresenceMinutes ?? MIN_PRESENCE_MINUTES
    const earlyLeaveMin =
      session.school.conferenceEarlyLeaveMinutes ?? EARLY_LEAVE_MINUTES
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
      select: {
        periodId: true,
        period: { select: { name: true } },
        classId: true,
      },
    })
    if (!slot?.periodId) return { marked: 0, updated: 0, skipped: "no_period" }
    const periodId = slot.periodId
    const periodName = slot.period?.name ?? null
    // Legacy subject-class reference, when the slot has one — lets a
    // student's own attendance view (records.ts) resolve a class name for a
    // VIRTUAL row the same way it does for a manually-marked one.
    const classId = slot.classId ?? null

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
      select: {
        userId: true,
        joinedAt: true,
        leftAt: true,
        durationSeconds: true,
        activeSince: true,
      },
    })
    const presenceByUser = new Map<string, Presence>()
    for (const p of participants) presenceByUser.set(p.userId, p)

    const start = session.actualStart ?? session.scheduledStart
    const lateAfter = new Date(start.getTime() + lateGraceMin * 60_000)
    // Attendance.date is @db.Date — the stored value must be the SCHOOL-LOCAL
    // calendar day of the session, not the UTC calendar day of the start
    // instant. Those two disagree for any session that starts between local
    // midnight and the UTC offset boundary (e.g. a session starting at
    // 01:00 Africa/Khartoum time is still 23:00 UTC the PREVIOUS day).
    // `schoolDayOfInstant` derives the same "YYYY-MM-DD" the manual register
    // would show for this instant, and `new Date(dayString)` builds the
    // @db.Date value the exact way `markPeriodAttendance`/`markAttendance` do
    // from a bare "YYYY-MM-DD" string (attendance/actions/periods.ts,
    // core.ts) — so a live-synced row and a manually-marked row for the same
    // school-local day always compare equal.
    const schoolTz = session.school.timezone ?? DEFAULT_SCHOOL_TZ
    const schoolDay = schoolDayOfInstant(schoolTz, start)
    const dateObj = new Date(schoolDay)

    // A student still in the room when it closes may have no `leftAt` at all:
    // the webhook writes it on `participant_left`, the sync runs from
    // `room_finished`, and the two events have no guaranteed order. So an unset
    // `leftAt` is read as "still in the room when we reconciled", NOT as a
    // zero-length visit — otherwise the floor below would mark the student who
    // sat through the whole lesson absent and only the ones who left early
    // present. `durationSeconds` carries the same hazard and is deliberately
    // not the source here.
    //
    // The open end is the RECONCILIATION CLOCK, not `scheduledEnd`. A class that
    // runs over is ordinary, and against `scheduledEnd` a student who joined
    // during the overtime scores a NEGATIVE duration — absent, for attending.
    // `syncedAt` cannot precede a join, and the 30-minute backstop cron only
    // ever errs generous.
    const syncedAt = new Date()
    // "Left early": gone before the last EARLY_LEAVE_MINUTES of the period and
    // not connected when we reconciled. Recorded as a check-out + note, not a
    // new status — every attendance consumer switches on the status enum, and a
    // fifth value would have to be taught to each of them.
    const earlyLeaveBefore = new Date(
      session.scheduledEnd.getTime() - earlyLeaveMin * 60_000
    )

    const studentIds = roster.map((s) => s.id)
    // Prefetch existing rows in one query (no per-student findFirst N+1).
    // Deliberately NOT filtered on deletedAt — per this block's revive-on-
    // update convention (attendance/CLAUDE.md Danger Zones), a soft-deleted
    // row still occupies the unique key and must be found here so it can be
    // revived, not collided with by createMany. method/status/deletedAt are
    // read for the hybrid-safety rule below — never for display, so the
    // extra columns cost nothing at the call site.
    const existingRows = await db.attendance.findMany({
      where: {
        schoolId,
        sectionId,
        date: dateObj,
        periodId,
        studentId: { in: studentIds },
      },
      select: {
        id: true,
        studentId: true,
        method: true,
        status: true,
        deletedAt: true,
      },
    })
    const existingByStudent = new Map(
      existingRows.map((r) => [
        r.studentId,
        {
          id: r.id,
          method: r.method,
          status: r.status,
          deletedAt: r.deletedAt,
        },
      ])
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
        const connected = presence ? connectedSeconds(presence, syncedAt) : 0
        let status: "PRESENT" | "ABSENT" | "LATE" = "ABSENT"
        let checkInTime: Date | null = null
        let checkOutTime: Date | null = null
        let leftEarly = false
        if (joinedAt && connected >= minPresenceMin * 60) {
          checkInTime = joinedAt
          status = joinedAt.getTime() > lateAfter.getTime() ? "LATE" : "PRESENT"
          // Still connected at reconciliation → they stayed to the end.
          checkOutTime = presence?.activeSince
            ? null
            : (presence?.leftAt ?? null)
          leftEarly =
            !presence?.activeSince &&
            !!presence?.leftAt &&
            presence.leftAt.getTime() < earlyLeaveBefore.getTime()
        }
        const notes = leftEarly
          ? "auto: live-class presence · left early"
          : "auto: live-class presence"

        const existing = existingByStudent.get(student.id)
        if (existing) {
          // Hybrid-school safety (attn-05): a MANUAL row already marking the
          // student PRESENT/LATE/EXCUSED — i.e. they were seen in the
          // physical room — must never be downgraded to ABSENT just because
          // they didn't also join the online room. Presence can only FILL or
          // UPGRADE such a row (write check-in/out + method VIRTUAL when the
          // presence itself says PRESENT/LATE); when presence says ABSENT the
          // manual mark is left untouched entirely. A VIRTUAL row (or one
          // already ABSENT/SICK/HOLIDAY) has no such protection and is
          // written normally, same as before. A SOFT-DELETED manual row is
          // excluded from the protection: an admin-removed mark was never
          // "seen in the room" and must not block the row from being
          // revived (see the `deletedAt: null` write below).
          const isManualPresentLike =
            existing.deletedAt == null &&
            existing.method !== "VIRTUAL" &&
            (existing.status === "PRESENT" ||
              existing.status === "LATE" ||
              existing.status === "EXCUSED")
          if (isManualPresentLike && status === "ABSENT") {
            continue
          }
          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status,
              method: "VIRTUAL",
              markedAt: new Date(),
              deletedAt: null, // revive a soft-deleted row on re-sync
              notes,
              ...(checkInTime ? { checkInTime } : {}),
              ...(checkOutTime ? { checkOutTime } : {}),
            },
          })
          updated++
        } else {
          toCreate.push({
            schoolId,
            studentId: student.id,
            classId,
            date: dateObj,
            status,
            method: "VIRTUAL",
            periodId,
            periodName,
            timetableId,
            sectionId,
            markedBy: null,
            checkInTime,
            checkOutTime,
            notes,
          })
          marked++
        }
      }

      if (toCreate.length > 0) {
        // skipDuplicates: a genuine unique-constraint collision on one
        // student (e.g. a manual period-scoped row created between the
        // prefetch and this write) must not abort the whole batch and leave
        // every other student in the roster unmarked.
        await tx.attendance.createMany({
          data: toCreate,
          skipDuplicates: true,
        })
      }
    })

    return { marked, updated }
  } catch (err) {
    console.error("[conference] syncLiveAttendance failed", {
      schoolId,
      sessionId,
      err: err instanceof Error ? err.message : err,
    })
    return { marked: 0, updated: 0, skipped: "error" }
  }
}

/**
 * Why a session will — or will not — have its attendance written from
 * presence. The exact conditions `syncLiveAttendance` checks above,
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
