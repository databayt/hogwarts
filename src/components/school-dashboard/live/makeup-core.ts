// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Make-up class («حصة تعويضية») — the server core.
//
// When an online class was cancelled, or nobody started it (the end-stale cron
// flips it to `cancelled` 30 minutes after its end), its teacher schedules a
// replacement at a time when the teacher and the section are both free — by
// themselves, no approval. An admin may do it for any teacher.
//
// NOT a "use server" module: every function takes the ACTOR (`MakeupActor`),
// and a server action must never accept a caller-supplied identity. The thin
// wrappers in ./actions/makeup.ts build the actor from the session. Same split
// as read-live-class.ts / join-core.ts.
//
// In code the word is `makeup`. "Substitute" belongs to the timetable block
// (SubstitutionRecord — another teacher covering a slot) and is unrelated.
//
// `makeupForId` always points at the ROOT missed class: a re-planned make-up
// is a new row under the same root, never a make-up of a make-up.
import "server-only"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import type { Prisma, UserRole } from "@prisma/client"

import {
  ACTION_ERRORS,
  actionError,
  type ActionErrorCode,
} from "@/lib/action-errors"
import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { schoolCalendarDayOf } from "@/lib/timezone"
import {
  PERIOD_GRID_SELECT,
  periodScope,
} from "@/components/school-dashboard/timetable/periods"

import {
  afterLiveClassCreated,
  createLiveClassCore,
} from "./actions/create-core"
import {
  liveListRevalidatePaths,
  liveSessionRevalidatePaths,
} from "./actions/helpers"
import { notifyClassCancelled } from "./actions/notifications"
import { combinedGroupForSlot, groupSectionIds } from "./combined"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  schoolDayWindow,
} from "./day-window"
import {
  suggestMakeupSlots as computeMakeupSlots,
  intervalsOverlap,
  spanOnDay,
  type Interval,
  type MakeupCandidate,
} from "./makeup-suggest"
import { findClosuresInRange } from "./school-calendar"

// ============================================================================
// Types
// ============================================================================

/** Who is acting — always built from the session/token, never from input. */
export type MakeupActor = {
  userId: string
  role: UserRole
  schoolId: string
}

export type MakeupFailure = ReturnType<typeof actionError>
export type MakeupResult<T> = { success: true; data: T } | MakeupFailure

export type MissedClass = {
  id: string
  title: string
  scheduledStart: Date
  scheduledEnd: Date
  section: {
    id: string
    name: string
    grade: { id: string; name: string } | null
  } | null
  subject: { id: string; name: string } | null
  teacher: {
    id: string
    firstName: string
    middleName: string | null
    lastName: string
    profilePhotoUrl: string | null
  }
  /** The latest non-cancelled make-up — only when `includeMadeUp` was asked. */
  madeUpBy: {
    id: string
    scheduledStart: Date
    status: "scheduled" | "live" | "ended"
  } | null
}

export type MakeupSlotDto = {
  startIso: string
  endIso: string
  kind: MakeupCandidate["kind"]
  periodId: string | null
  periodName: string | null
}

export type MakeupSuggestions = {
  missedId: string
  durationMin: number
  /** The school's IANA zone — `day` and every time are in it. */
  timeZone: string
  days: { day: string; dayOfWeek: number; slots: MakeupSlotDto[] }[]
}

export type ScheduleConflict = {
  kind: "timetable" | "session"
  id: string
  teacherId: string | null
  sectionId: string | null
  start: Date
  end: Date
}

type CreatedMakeup = Extract<
  Awaited<ReturnType<typeof createLiveClassCore>>,
  { success: true }
>["data"]

// ============================================================================
// Constants and the "missed" predicate
// ============================================================================

const ADMIN_ROLES: UserRole[] = ["DEVELOPER", "ADMIN"]
/** A child in one of these states means the class is already being made up. */
const ACTIVE_MAKEUP_STATUSES = ["scheduled", "live", "ended"] as const
/** Sessions that occupy a teacher / section's time. */
const BUSY_STATUSES = ["scheduled", "live"] as const
const ADMIN_LIST_CAP = 100
const TX_OPTIONS = { timeout: 15_000, maxWait: 10_000 } as const

/**
 * The predicate behind "a class that was missed": cancelled, never started
 * (`actualStart` null — also what the end-stale cron leaves behind), not the
 * practice room, not deleted, with a section AND a subject (an all-day open
 * room has no subject), and not itself a make-up (a make-up is never "missed").
 */
export function missedClassWhere(
  schoolId: string
): Prisma.ConferenceWhereInput {
  return {
    schoolId,
    status: "cancelled",
    actualStart: null,
    isPractice: false,
    deletedAt: null,
    sectionId: { not: null },
    subjectId: { not: null },
    makeupForId: null,
  }
}

/** A make-up that still stands: planned, running, or already held. */
function activeMakeupWhere(): Prisma.ConferenceWhereInput {
  return { status: { in: [...ACTIVE_MAKEUP_STATUSES] }, deletedAt: null }
}

/** Open rooms (no slot, no subject) span the whole day and never conflict. */
const NOT_AN_OPEN_ROOM: Prisma.ConferenceWhereInput = {
  NOT: { timetableId: null, subjectId: null },
}

/** Title prefix and notice wording, stored in the class's own language. */
const MAKEUP_TEXT: Record<
  "ar" | "en",
  { prefix: string; cancelled: string; replanned: string }
> = {
  ar: {
    prefix: "حصة تعويضية: ",
    cancelled: "أُلغيت الحصة التعويضية",
    replanned: "تغيّر موعد الحصة التعويضية",
  },
  en: {
    prefix: "Make-up class: ",
    cancelled: "The make-up class was cancelled",
    replanned: "The make-up class was moved to another time",
  },
}

function pickLang(lang: string | null | undefined): "ar" | "en" {
  return lang === "en" ? "en" : "ar"
}

/** `Conference.title` is capped at 255; the prefix must not push it over. */
function makeupTitle(title: string, lang: string): string {
  const prefix = MAKEUP_TEXT[pickLang(lang)].prefix
  return `${prefix}${title}`.slice(0, 255)
}

function isAdmin(actor: MakeupActor): boolean {
  return ADMIN_ROLES.includes(actor.role)
}

/** The owner of a class: its teacher, or an admin of the school. */
function mayActFor(
  actor: MakeupActor,
  teacherUserId: string | null | undefined
): boolean {
  if (isAdmin(actor)) return true
  return (
    actor.role === "TEACHER" &&
    !!teacherUserId &&
    teacherUserId === actor.userId
  )
}

/** Thrown inside a transaction so it rolls back; mapped to an actionError. */
class MakeupAbort extends Error {
  constructor(
    readonly code: ActionErrorCode,
    readonly details?: string
  ) {
    super(code)
  }
}

function toFailure(err: unknown): MakeupFailure {
  if (err instanceof MakeupAbort) return actionError(err.code, err.details)
  return actionError(ACTION_ERRORS.LIVE_CLASS_CREATE_FAILED)
}

// ============================================================================
// Read: the missed classes
// ============================================================================

const MISSED_SELECT = {
  id: true,
  title: true,
  scheduledStart: true,
  scheduledEnd: true,
  section: {
    select: {
      id: true,
      name: true,
      grade: { select: { id: true, name: true } },
    },
  },
  subject: { select: { id: true, name: true } },
  teacher: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      profilePhotoUrl: true,
    },
  },
  makeups: {
    where: { status: { in: [...ACTIVE_MAKEUP_STATUSES] }, deletedAt: null },
    orderBy: { scheduledStart: "desc" as const },
    take: 1,
    select: { id: true, scheduledStart: true, status: true },
  },
} satisfies Prisma.ConferenceSelect

/**
 * The classes the actor may make up, newest first: missed in the last `days`
 * days. A teacher sees their own; an admin sees the school's (first 100).
 * Without `includeMadeUp` a class that already has a make-up is left out.
 */
export async function listMissedClasses(
  actor: MakeupActor,
  opts: { days?: number; includeMadeUp?: boolean } = {}
): Promise<MissedClass[]> {
  const days = opts.days ?? 14
  const admin = isAdmin(actor)
  if (!admin && actor.role !== "TEACHER") return []

  const now = new Date()
  const from = new Date(now.getTime() - days * 86_400_000)
  const where: Prisma.ConferenceWhereInput = {
    ...missedClassWhere(actor.schoolId),
    scheduledStart: { gte: from, lt: now },
    ...(admin ? {} : { teacher: { userId: actor.userId } }),
    ...(opts.includeMadeUp ? {} : { makeups: { none: activeMakeupWhere() } }),
  }

  const rows = await db.conference.findMany({
    where,
    orderBy: { scheduledStart: "desc" },
    take: ADMIN_LIST_CAP,
    select: MISSED_SELECT,
  })

  return rows.map((r) => {
    const child = opts.includeMadeUp ? (r.makeups[0] ?? null) : null
    return {
      id: r.id,
      title: r.title,
      scheduledStart: r.scheduledStart,
      scheduledEnd: r.scheduledEnd,
      section: r.section,
      subject: r.subject,
      teacher: r.teacher,
      madeUpBy: child && {
        id: child.id,
        scheduledStart: child.scheduledStart,
        status: child.status as "scheduled" | "live" | "ended",
      },
    }
  })
}

// ============================================================================
// Conflicts
// ============================================================================

type Client = Prisma.TransactionClient | typeof db

/**
 * Everything that already occupies the teacher or any of the sections inside
 * `[start, end)`: the term's weekly timetable slots on that school day, and
 * the scheduled / running sessions overlapping the range. The conflicts come
 * back; an empty array means the time is free.
 *
 * Exported so another create path can ask the same question later — it is NOT
 * wired into any other path yet.
 */
export async function findScheduleConflicts(
  schoolId: string,
  q: {
    teacherId: string
    sectionIds: string[]
    start: Date
    end: Date
    ignoreSessionId?: string
  },
  client: Client = db
): Promise<ScheduleConflict[]> {
  const range: Interval = { start: q.start, end: q.end }
  const [school, termRes] = await Promise.all([
    client.school.findUnique({
      where: { id: schoolId },
      select: { timezone: true },
    }),
    resolveActiveTerm(schoolId),
  ])
  const tz = school?.timezone || DEFAULT_SCHOOL_TZ
  const who: Prisma.ConferenceWhereInput[] = [
    { teacherId: q.teacherId },
    ...(q.sectionIds.length > 0 ? [{ sectionId: { in: q.sectionIds } }] : []),
  ]

  const [slots, sessions] = await Promise.all([
    termRes.term
      ? client.timetable.findMany({
          where: {
            schoolId,
            termId: termRes.term.id,
            weekOffset: 0,
            dayOfWeek: schoolDayOfWeek(tz, q.start),
            period: { isBreak: false },
            OR: [
              { teacherId: q.teacherId },
              ...(q.sectionIds.length > 0
                ? [{ sectionId: { in: q.sectionIds } }]
                : []),
            ],
          },
          select: {
            id: true,
            teacherId: true,
            sectionId: true,
            period: { select: { startTime: true, endTime: true } },
          },
        })
      : Promise.resolve([]),
    client.conference.findMany({
      where: {
        schoolId,
        deletedAt: null,
        isPractice: false,
        status: { in: [...BUSY_STATUSES] },
        ...(q.ignoreSessionId ? { id: { not: q.ignoreSessionId } } : {}),
        scheduledStart: { lt: q.end },
        scheduledEnd: { gt: q.start },
        AND: [{ OR: who }, NOT_AN_OPEN_ROOM],
      },
      select: {
        id: true,
        teacherId: true,
        sectionId: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    }),
  ])

  const day = schoolCalendarDayOf(q.start, tz)
  const out: ScheduleConflict[] = []
  for (const s of slots) {
    const span = spanOnDay(tz, day, s.period)
    if (span && intervalsOverlap(range, span)) {
      out.push({
        kind: "timetable",
        id: s.id,
        teacherId: s.teacherId,
        sectionId: s.sectionId,
        start: span.start,
        end: span.end,
      })
    }
  }
  for (const c of sessions) {
    out.push({
      kind: "session",
      id: c.id,
      teacherId: c.teacherId,
      sectionId: c.sectionId,
      start: c.scheduledStart,
      end: c.scheduledEnd,
    })
  }
  return out
}

// ============================================================================
// Read: free times for a missed class
// ============================================================================

/** The sections a missed class covered: its combined group, else its own. */
async function sectionsOfMissed(
  schoolId: string,
  missed: {
    sectionId: string | null
    timetableId: string | null
    scheduledStart: Date
  }
): Promise<string[]> {
  if (!missed.sectionId) return []
  if (!missed.timetableId) return [missed.sectionId]
  const group = await combinedGroupForSlot(
    schoolId,
    missed.timetableId,
    missed.scheduledStart
  )
  return group
    ? [...new Set([missed.sectionId, ...groupSectionIds(group)])]
    : [missed.sectionId]
}

/**
 * Times at which the teacher and the section(s) of a missed class are all free,
 * soonest first, grouped by school day. The slot math is the pure
 * `suggestMakeupSlots` in ./makeup-suggest.ts; this loads its inputs.
 */
export async function suggestMakeupSlots(
  actor: MakeupActor,
  missedId: string,
  opts: { horizonDays?: number; limit?: number } = {}
): Promise<MakeupResult<MakeupSuggestions>> {
  const horizonDays = opts.horizonDays ?? 14
  const limit = opts.limit ?? 12
  const schoolId = actor.schoolId

  const [missed, school, termRes] = await Promise.all([
    db.conference.findFirst({
      where: { ...missedClassWhere(schoolId), id: missedId },
      select: {
        id: true,
        teacherId: true,
        sectionId: true,
        timetableId: true,
        scheduledStart: true,
        scheduledEnd: true,
        teacher: { select: { userId: true } },
        section: { select: { gradeId: true } },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { timezone: true, conferenceMaxDuration: true },
    }),
    resolveActiveTerm(schoolId),
  ])
  if (!missed || !school) return actionError(ACTION_ERRORS.MAKEUP_NOT_ELIGIBLE)
  if (!mayActFor(actor, missed.teacher.userId)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  const tz = school.timezone || DEFAULT_SCHOOL_TZ
  const durationMin = Math.round(
    (missed.scheduledEnd.getTime() - missed.scheduledStart.getTime()) / 60_000
  )
  const base = {
    missedId: missed.id,
    durationMin,
    timeZone: tz,
  }
  const term = termRes.term
  // No term, no timetable: nothing to plan against.
  if (!term) return { success: true, data: { ...base, days: [] } }

  const now = new Date()
  const windowStart = schoolDayWindow(tz, now).start
  const lastDay = new Date(now.getTime() + (horizonDays - 1) * 86_400_000)
  const windowEnd = schoolDayWindow(tz, lastDay).end
  const sectionIds = await sectionsOfMissed(schoolId, missed)

  const busyWho: Prisma.ConferenceWhereInput[] = [
    { teacherId: missed.teacherId },
    ...(sectionIds.length > 0 ? [{ sectionId: { in: sectionIds } }] : []),
  ]
  const [weekConfigs, closures, periods, slots, sessions] = await Promise.all([
    db.schoolWeekConfig.findMany({
      where: { schoolId, OR: [{ termId: term.id }, { termId: null }] },
      select: { termId: true, workingDays: true },
    }),
    findClosuresInRange(schoolId, windowStart, windowEnd),
    db.period.findMany({
      where: {
        schoolId,
        yearId: term.yearId,
        isBreak: false,
        untimed: false,
        ...periodScope(missed.section?.gradeId),
      },
      select: PERIOD_GRID_SELECT,
    }),
    db.timetable.findMany({
      where: {
        schoolId,
        termId: term.id,
        weekOffset: 0,
        period: { isBreak: false },
        OR: [
          { teacherId: missed.teacherId },
          ...(sectionIds.length > 0 ? [{ sectionId: { in: sectionIds } }] : []),
        ],
      },
      select: {
        dayOfWeek: true,
        period: { select: { startTime: true, endTime: true } },
      },
    }),
    db.conference.findMany({
      where: {
        schoolId,
        deletedAt: null,
        isPractice: false,
        status: { in: [...BUSY_STATUSES] },
        id: { not: missed.id },
        scheduledStart: { lt: windowEnd },
        scheduledEnd: { gt: windowStart },
        AND: [{ OR: busyWho }, NOT_AN_OPEN_ROOM],
      },
      select: { scheduledStart: true, scheduledEnd: true },
    }),
  ])

  // The term's own config beats the school default; Sun–Thu if neither exists
  // (the default getScheduleConfig applies).
  const cfg =
    weekConfigs.find((c) => c.termId === term.id) ??
    weekConfigs.find((c) => c.termId === null)
  const workingDays =
    cfg && cfg.workingDays.length > 0 ? cfg.workingDays : [0, 1, 2, 3, 4]

  const days = computeMakeupSlots({
    now,
    timeZone: tz,
    horizonDays,
    limit,
    durationMin,
    maxDurationMin: school.conferenceMaxDuration,
    workingDays,
    closures,
    periods,
    weeklySlots: slots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.period.startTime,
      endTime: s.period.endTime,
    })),
    busy: sessions.map((s) => ({
      start: s.scheduledStart,
      end: s.scheduledEnd,
    })),
  })

  return {
    success: true,
    data: {
      ...base,
      days: days.map((d) => ({
        day: d.day,
        dayOfWeek: d.dayOfWeek,
        slots: d.slots.map((s) => ({
          startIso: s.start.toISOString(),
          endIso: s.end.toISOString(),
          kind: s.kind,
          periodId: s.periodId,
          periodName: s.periodName,
        })),
      })),
    },
  }
}

// ============================================================================
// Write: create / cancel / replan
// ============================================================================

/** Lock the root row: two taps on «عوّض الحصة» cannot both pass the checks. */
async function lockMissed(
  tx: Prisma.TransactionClient,
  schoolId: string,
  missedId: string
) {
  await tx.$queryRaw`SELECT id FROM live_class_sessions WHERE id = ${missedId} AND "schoolId" = ${schoolId} FOR UPDATE`
}

/**
 * The checks and the create, inside the caller's transaction. Throws
 * `MakeupAbort` (rolling the transaction back) on any refusal.
 */
async function createMakeupInTx(
  tx: Prisma.TransactionClient,
  actor: MakeupActor,
  input: { missedId: string; start: Date; end: Date },
  opts: { locked?: boolean } = {}
): Promise<CreatedMakeup> {
  const schoolId = actor.schoolId
  if (!opts.locked) await lockMissed(tx, schoolId, input.missedId)

  const missed = await tx.conference.findFirst({
    where: { ...missedClassWhere(schoolId), id: input.missedId },
    select: {
      id: true,
      title: true,
      description: true,
      lang: true,
      teacherId: true,
      sectionId: true,
      subjectId: true,
      timetableId: true,
      scheduledStart: true,
      visibility: true,
      catalogLessonId: true,
      provider: true,
      meetingUrl: true,
      meetingProvider: true,
      teacher: { select: { userId: true } },
    },
  })
  if (!missed || !missed.sectionId) {
    throw new MakeupAbort(ACTION_ERRORS.MAKEUP_NOT_ELIGIBLE)
  }
  if (!mayActFor(actor, missed.teacher.userId)) {
    throw new MakeupAbort(ACTION_ERRORS.UNAUTHORIZED)
  }

  const planned = await tx.conference.count({
    where: { schoolId, makeupForId: missed.id, ...activeMakeupWhere() },
  })
  if (planned > 0) throw new MakeupAbort(ACTION_ERRORS.MAKEUP_ALREADY_PLANNED)

  if (
    !Number.isFinite(input.start.getTime()) ||
    !Number.isFinite(input.end.getTime()) ||
    input.end.getTime() <= input.start.getTime() ||
    input.start.getTime() < Date.now()
  ) {
    throw new MakeupAbort(ACTION_ERRORS.VALIDATION_ERROR)
  }

  const sectionIds = await sectionsOfMissed(schoolId, missed)
  const conflicts = await findScheduleConflicts(
    schoolId,
    {
      teacherId: missed.teacherId,
      sectionIds,
      start: input.start,
      end: input.end,
    },
    tx
  )
  if (conflicts.length > 0) throw new MakeupAbort(ACTION_ERRORS.MAKEUP_CONFLICT)

  const school = await tx.school.findUnique({
    where: { id: schoolId },
    select: { conferenceRecordingDefault: true },
  })

  // Duration against the school's cap, the checks, the recording rule, the HOST
  // invite — all in the one create path every live class goes through.
  const res = await createLiveClassCore(
    { schoolId },
    {
      title: makeupTitle(missed.title, missed.lang),
      description: missed.description ?? undefined,
      lang: missed.lang,
      teacherId: missed.teacherId,
      sectionId: missed.sectionId,
      subjectId: missed.subjectId ?? undefined,
      // Never the slot: a make-up must not be handed to a regular period.
      timetableId: undefined,
      scheduledStart: input.start.toISOString(),
      scheduledEnd: input.end.toISOString(),
      recordingEnabled: school?.conferenceRecordingDefault ?? true,
      visibility: missed.visibility,
      catalogLessonId: missed.catalogLessonId ?? undefined,
    },
    {
      makeupForId: missed.id,
      tx,
      ...(missed.provider === "external"
        ? {
            provider: "external" as const,
            meetingUrl: missed.meetingUrl,
            meetingProvider: missed.meetingProvider,
          }
        : {}),
    }
  )
  if (!res.success) {
    throw new MakeupAbort(
      (res as MakeupFailure).error,
      (res as MakeupFailure).details
    )
  }
  return res.data
}

function revalidateLive() {
  for (const path of liveListRevalidatePaths()) revalidatePath(path, "page")
  for (const path of liveSessionRevalidatePaths()) revalidatePath(path, "page")
}

/**
 * Schedule a make-up for a missed class. The owner (the class's teacher) or an
 * admin only. Refused when the class is not missed (MAKEUP_NOT_ELIGIBLE), a
 * make-up already stands (MAKEUP_ALREADY_PLANNED) or the time clashes with the
 * teacher's or a section's other class (MAKEUP_CONFLICT).
 */
export async function createMakeup(
  actor: MakeupActor,
  input: { missedId: string; startIso: string; endIso: string }
): Promise<MakeupResult<CreatedMakeup>> {
  try {
    const created = await db.$transaction(
      (tx) =>
        createMakeupInTx(tx, actor, {
          missedId: input.missedId,
          start: new Date(input.startIso),
          end: new Date(input.endIso),
        }),
      TX_OPTIONS
    )
    // Only now — after the commit — is the class announced.
    afterLiveClassCreated(actor.schoolId, created)
    revalidateLive()
    return { success: true, data: created }
  } catch (err) {
    return toFailure(err)
  }
}

/**
 * Cancel a planned make-up. The owner or an admin; only a `scheduled` one.
 * Deliberately NOT `cancelLiveClass`, which is admin-only. The root class
 * becomes "missed" again (a cancelled child no longer counts).
 */
export async function cancelMakeup(
  actor: MakeupActor,
  makeupId: string
): Promise<MakeupResult<{ id: string }>> {
  try {
    const makeup = await db.conference.findFirst({
      where: {
        id: makeupId,
        schoolId: actor.schoolId,
        deletedAt: null,
        makeupForId: { not: null },
      },
      select: {
        id: true,
        status: true,
        lang: true,
        teacher: { select: { userId: true } },
      },
    })
    if (!makeup) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
    if (!mayActFor(actor, makeup.teacher.userId)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
    if (makeup.status !== "scheduled") {
      return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
    }

    // Guarded flip: a double tap (or a cron) cannot cancel it twice.
    const flipped = await db.conference.updateMany({
      where: { id: makeup.id, schoolId: actor.schoolId, status: "scheduled" },
      data: { status: "cancelled" },
    })
    if (flipped.count !== 1) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
    }

    const reason = MAKEUP_TEXT[pickLang(makeup.lang)].cancelled
    after(() => notifyClassCancelled(actor.schoolId, makeup.id, reason))
    revalidateLive()
    return { success: true, data: { id: makeup.id } }
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_UPDATE_FAILED)
  }
}

/**
 * Move a planned make-up: cancel it and create the replacement under the same
 * root, in ONE transaction — a refused new time leaves the old one standing.
 */
export async function replanMakeup(
  actor: MakeupActor,
  input: { makeupId: string; startIso: string; endIso: string }
): Promise<MakeupResult<CreatedMakeup>> {
  try {
    const old = await db.conference.findFirst({
      where: {
        id: input.makeupId,
        schoolId: actor.schoolId,
        deletedAt: null,
        makeupForId: { not: null },
      },
      select: {
        id: true,
        status: true,
        lang: true,
        makeupForId: true,
        teacher: { select: { userId: true } },
      },
    })
    if (!old || !old.makeupForId) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
    }
    if (!mayActFor(actor, old.teacher.userId)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
    if (old.status !== "scheduled") {
      return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
    }
    const rootId = old.makeupForId

    const created = await db.$transaction(async (tx) => {
      await lockMissed(tx, actor.schoolId, rootId)
      const flipped = await tx.conference.updateMany({
        where: { id: old.id, schoolId: actor.schoolId, status: "scheduled" },
        data: { status: "cancelled" },
      })
      if (flipped.count !== 1) {
        throw new MakeupAbort(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
      }
      return createMakeupInTx(
        tx,
        actor,
        {
          missedId: rootId,
          start: new Date(input.startIso),
          end: new Date(input.endIso),
        },
        { locked: true }
      )
    }, TX_OPTIONS)

    const reason = MAKEUP_TEXT[pickLang(old.lang)].replanned
    after(() => notifyClassCancelled(actor.schoolId, old.id, reason))
    afterLiveClassCreated(actor.schoolId, created)
    revalidateLive()
    return { success: true, data: created }
  } catch (err) {
    return toFailure(err)
  }
}
