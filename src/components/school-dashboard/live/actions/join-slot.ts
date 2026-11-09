// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The join link: one URL per timetable slot, resolved at click time.
//
// `/{lang}/live/join/{timetableId}` is what every surface links to — the
// timetable cell, the dashboard's Today rows and phone strip, the banner, the
// notifications. A slot recurs every week, so the URL is valid every week; the
// room behind it is today's, decided here, on the server, when the reader taps.
// That is the whole point: no surface ever holds a stale room id, a teacher's
// Start and a student's Join are the same link (the room decides who hosts),
// and a class whose row the sweep has not written yet is written now instead
// of showing a dead button.
//
// Kept apart from the page so it can be unit-tested against a mocked `db`.
import "server-only"

import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"

import { combinedGroupForSlot, groupSectionIds } from "../combined"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  schoolDayWindow,
  slotInstantsOn,
} from "../day-window"
import { joinPhase, joinWindow } from "../join-window"
import { resolveOnlinePolicies } from "../online-policy"
import { canAccessSession } from "./helpers"
import { materializeSlotForDay, resolveSubstitutes } from "./materialize-day"
import { findSlotSessionForDay } from "./slot-session"

export type SlotJoinOutcome =
  /** Today's room. The room page takes it from here (an external session is
   *  redirected to its meeting there, behind the same enrollment gate). */
  | { kind: "room"; sessionId: string }
  /** The section's standing meeting link — a `ConferenceLink`, no row. */
  | { kind: "external"; url: string }
  /** Too soon: the link opens at `opensAt`; the class starts at `startsAt`. */
  | { kind: "early"; opensAt: Date; startsAt: Date }
  /** The class is over for today. */
  | { kind: "over" }
  /** The teacher (or an admin) cancelled today's class. */
  | { kind: "cancelled" }
  /** This slot does not fall on today in the school's calendar. */
  | { kind: "not_today"; startsAt: Date | null }
  /** The section is taught in person today and nothing was opened online. */
  | { kind: "not_online" }
  /** Online, in the window, but no room could be made (e.g. an external
   *  school with no link for this class, or a declared holiday). */
  | { kind: "unavailable"; reason: string }
  | { kind: "forbidden" }
  | { kind: "not_found" }

const JOINABLE = ["scheduled", "live"] as const

/**
 * Resolve where `/live/join/{timetableId}` sends this reader right now.
 *
 * Order, most specific first — and deliberately NOT `attachLiveClasses`, whose
 * "(section, subject) earliest today" tier would hand an afternoon slot the
 * morning's room when a subject is taught twice:
 *
 *   1. today's row anchored to THIS slot,
 *   2. an ad-hoc row for this section + subject today (no slot anchor — a
 *      class a teacher opened by hand),
 *   3. the section's all-day open room,
 *   4. the standing meeting link, only while the section is online,
 *   5. a row made now, when the section is online and the sweep missed it.
 *
 * Rows that already exist win even if the school has since gone back to
 * in-person: online is additive, and suppressing a room someone is sitting in
 * is the worse failure (the same rule as `attachLiveClasses`).
 */
export async function resolveSlotJoin(input: {
  schoolId: string
  userId: string
  role: UserRole
  timetableId: string
  now?: Date
}): Promise<SlotJoinOutcome> {
  const { schoolId, userId, role, timetableId } = input
  const now = input.now ?? new Date()

  const [slot, school] = await Promise.all([
    db.timetable.findFirst({
      where: { id: timetableId, schoolId },
      select: {
        id: true,
        termId: true,
        dayOfWeek: true,
        weekOffset: true,
        sectionId: true,
        subjectId: true,
        teacherId: true,
        period: { select: { startTime: true, endTime: true, isBreak: true } },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: {
        timezone: true,
        conferenceReminderLeadMinutes: true,
        conferenceGuardiansObserve: true,
      },
    }),
  ])
  if (!slot || !school || !slot.sectionId || !slot.period) {
    return { kind: "not_found" }
  }
  if (slot.period.isBreak) return { kind: "not_found" }
  const sectionId = slot.sectionId

  // A combined class (one teacher, several sections, the same period) has ONE
  // room, owned by its primary slot: every member's link leads into it, and a
  // student of any member section may follow a link to it — the notices for
  // the class carry the primary's link. `null` for a class taught alone.
  const group = await combinedGroupForSlot(schoolId, slot.id, now)
  const readerSections = group ? groupSectionIds(group) : sectionId
  const roomSlotId = group?.primaryId ?? slot.id
  const roomSectionId =
    group?.members.find((m) => m.slotId === roomSlotId)?.sectionId ?? sectionId

  // ── Who is asking ─────────────────────────────────────────────────────────
  // Decided BEFORE anything about the day, so an outsider learns nothing about
  // a class (not even that it is on another day) and can never make a row.
  const timeZone = school.timezone || DEFAULT_SCHOOL_TZ
  let isHost = false
  if (role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    })
    if (!teacher) return { kind: "forbidden" }
    if (teacher.id === slot.teacherId) {
      isHost = true
    } else {
      // A confirmed substitute hosts the class they are covering — the same
      // rule the sweep uses when it writes the row.
      const subs = await resolveSubstitutes(schoolId, timeZone, now, [slot.id])
      isHost = subs.get(slot.id)?.teacherId === teacher.id
    }
    // Any other teacher of the school may still look in (the room decides
    // CO_HOST or refuses); they just never get the host's earlier window.
  } else if (role === "STUDENT") {
    const ok = await canAccessSession(
      { userId, role, schoolId },
      readerSections
    )
    if (!ok) return { kind: "forbidden" }
  } else if (role === "GUARDIAN") {
    // The school switch first: with observing off there is nothing a guardian
    // could do in the room, so the link refuses instead of the room.
    if (!school.conferenceGuardiansObserve) return { kind: "forbidden" }
    const ok = await canAccessSession(
      { userId, role, schoolId },
      readerSections
    )
    if (!ok) return { kind: "forbidden" }
  } else if (role !== "ADMIN" && role !== "DEVELOPER") {
    // STAFF and ACCOUNTANT join only school-wide sessions, and a slot's class
    // is section-scoped (join-core's role matrix).
    return { kind: "forbidden" }
  }

  // ── Is it today? ──────────────────────────────────────────────────────────
  const { term } = await resolveActiveTerm(schoolId)
  const instants = slotInstantsOn(timeZone, now, slot.period)
  const isToday =
    Boolean(term) &&
    term!.id === slot.termId &&
    slot.weekOffset === 0 &&
    slot.dayOfWeek === schoolDayOfWeek(timeZone, now)
  if (!isToday || !instants) {
    return { kind: "not_today", startsAt: null }
  }

  const window = joinWindow({
    startMs: instants.scheduledStart.getTime(),
    endMs: instants.scheduledEnd.getTime(),
    leadMinutes: school.conferenceReminderLeadMinutes,
    isHost,
  })
  const phase = joinPhase(now.getTime(), window)
  const early: SlotJoinOutcome = {
    kind: "early",
    opensAt: new Date(window.opensAtMs),
    startsAt: instants.scheduledStart,
  }

  // ── 1–3: a room that already exists ───────────────────────────────────────
  const existing = await findExistingRoom(schoolId, timeZone, now, {
    slotId: roomSlotId,
    sectionId,
    subjectId: slot.subjectId,
  })
  if (existing) {
    // A room the teacher already opened is open to everyone it admits, early
    // or late — the window only guards the moment of starting.
    if (existing.status === "live") {
      return { kind: "room", sessionId: existing.id }
    }
    if (phase === "early") return early
    if (phase === "over") return { kind: "over" }
    return { kind: "room", sessionId: existing.id }
  }

  // ── 4–5: only for a section that is online ────────────────────────────────
  const policy = (await resolveOnlinePolicies(schoolId, [sectionId], now)).get(
    sectionId
  )
  if (!policy?.online) return { kind: "not_online" }
  if (phase === "early") return early
  if (phase === "over") return { kind: "over" }

  // The standing link wins over making a row ONLY for a school whose classes
  // are external — a LiveKit school's room is the product, and a link pasted
  // long ago must not divert its students out of the app.
  if (policy.provider === "external" && slot.subjectId) {
    const link = await db.conferenceLink.findFirst({
      where: {
        schoolId,
        termId: slot.termId,
        sectionId,
        subjectId: slot.subjectId,
      },
      select: { meetingUrl: true },
    })
    if (link?.meetingUrl) return { kind: "external", url: link.meetingUrl }
  }

  const made = await materializeSlotForDay(
    schoolId,
    { id: roomSlotId, sectionId: roomSectionId },
    now
  )
  const fresh = await findExistingRoom(schoolId, timeZone, now, {
    slotId: roomSlotId,
    sectionId,
    subjectId: slot.subjectId,
  })
  if (fresh) return { kind: "room", sessionId: fresh.id }

  // Nothing joinable after the attempt. A cancelled or finished row for today
  // is the honest answer; otherwise report why the sweep declined.
  const decided = await findSlotSessionForDay(
    schoolId,
    roomSlotId,
    timeZone,
    now,
    ["cancelled", "ended"]
  )
  if (decided?.status === "cancelled") return { kind: "cancelled" }
  if (decided?.status === "ended") return { kind: "over" }
  const reason =
    Object.entries(made.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    // The sweep skips a slot with no teacher before it counts a reason —
    // name that case instead of "unknown", so the page can say who to ask.
    (slot.teacherId ? "unknown" : "no_teacher")
  // The link stays open for a grace period after the bell, but the sweep will
  // not write a room for a period that has ended: that is "over", not a fault.
  if (reason === "period_over") return { kind: "over" }
  return { kind: "unavailable", reason }
}

/**
 * Tiers 1–3: today's joinable row for this slot, else an ad-hoc row for the
 * section + subject, else the section's open room.
 */
async function findExistingRoom(
  schoolId: string,
  timeZone: string,
  now: Date,
  key: { slotId: string; sectionId: string; subjectId: string | null }
): Promise<{ id: string; status: string } | null> {
  const own = await findSlotSessionForDay(schoolId, key.slotId, timeZone, now, [
    ...JOINABLE,
  ])
  if (own) return own

  const { start, end } = schoolDayWindow(timeZone, now)
  const day = { gte: start, lt: end }

  if (key.subjectId) {
    // Unanchored only: a row anchored to ANOTHER slot is that period's class.
    const adHoc = await db.conference.findFirst({
      where: {
        schoolId,
        sectionId: key.sectionId,
        subjectId: key.subjectId,
        timetableId: null,
        status: { in: [...JOINABLE] },
        scheduledStart: day,
        deletedAt: null,
      },
      select: { id: true, status: true },
      orderBy: { scheduledStart: "asc" },
    })
    if (adHoc) return adHoc
  }

  return db.conference.findFirst({
    where: {
      schoolId,
      sectionId: key.sectionId,
      timetableId: null,
      subjectId: null,
      status: { in: [...JOINABLE] },
      scheduledStart: day,
      deletedAt: null,
    },
    select: { id: true, status: true },
    orderBy: { scheduledStart: "asc" },
  })
}
