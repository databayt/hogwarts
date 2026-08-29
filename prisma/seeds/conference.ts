// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
/**
 * Conference Seed — a working HYBRID school for the demo tenant.
 *
 * The block shipped with "no demo seed — schedule a class via the UI". That
 * left every demo surface empty and, worse, hid the one thing that actually
 * stopped an online school from working: 719 of the demo's 840 timetable slots
 * had no teacher, because the expertise seed was count-guarded and never
 * caught up with the catalog selections the school grew afterwards. A slot
 * with no teacher has no HOST, so the materializer skips it — an "online
 * school" that could put 14% of its classes online.
 *
 * What this seed does, in order (every step idempotent):
 *
 *   1. REPAIRS the prerequisites a live-class demo stands on:
 *      - `Period.isBreak` for rows seeded before the column existed;
 *      - expertise top-up so every subject the school teaches has qualified
 *        teachers (`teacher@balqalam.com` gets `student@balqalam.com`'s
 *        section's subjects, so the documented test trio works end to end);
 *      - a teacher on every teacherless slot — qualified, free at that
 *        (day, period), under the 25/week cap. Deterministic, additive: no
 *        existing assignment is touched.
 *   2. POLICY: the school teaches online by default over LiveKit, timetable
 *      mode, attendance auto-marked; two sections stay in-person, one opts in
 *      explicitly — the tri-state, on screen.
 *   3. HISTORY: the last five school days for the focus sections — ended
 *      sessions with participants (joined/left/duration), the webhook audit
 *      trail, and the VIRTUAL attendance the sync would have written. Presence
 *      follows the sync's own rules, floor included, so the register is exactly
 *      what production would produce.
 *   4. NEXT SCHOOL DAY: `scheduled` sessions for every online slot, written
 *      with the same day-qualified identity the cron uses, so the cron finds
 *      `exists` and never double-creates. One of them is hosted by a CONFIRMED
 *      substitute; one carries a catalog lesson + exam + assignment + link.
 *   5. A school-wide assembly, three recurring external links, and one declared
 *      holiday ten days out — each a feature the UI can show.
 *
 * Deliberately NOT here: recordings (there is no bucket to point at, and a
 * `ready` row with no object is a broken player).
 *
 * OPERATIONAL NOTE for the prod demo: flipping `conferenceOnlineDefault` arms
 * the live cron. From its next tick the demo materializes for real and fans
 * `starting_soon` reminders into every demo student's and guardian's bell —
 * that is the point. Those rows also accrue `emailSent:false` into the queue
 * `process-email-notifications` would drain; that job is off and must stay
 * off until it has an age gate (see DEPLOYMENT.md).
 *
 * Seed-safety: imports only pure modules. `day-window.ts` and
 * `room-naming.ts` carry no `server-only`; the materializer and policy
 * resolver do, so their rules are mirrored here, not imported.
 *
 * Every write carries `select: { id: true }`: a write with no select returns
 * EVERY column and P2022s on a database that lags the schema by one column —
 * prod lacks `schools.trialEndsAt` today, and this is exactly how that bit.
 */
import type { PrismaClient } from "@prisma/client"

import {
  schoolDayOfWeek,
  slotInstantsOn,
} from "@/components/school-dashboard/conference/day-window"
import { roomNameFor } from "@/components/school-dashboard/conference/livekit/room-naming"

import { logSuccess, logWarning } from "./utils"

// ---------------------------------------------------------------------------
// Knobs
// ---------------------------------------------------------------------------

/** The documented test accounts. Either domain, so the seed survives migration. */
const TEST_TEACHER_EMAILS = ["teacher@balqalam.com", "teacher@databayt.org"]
const TEST_STUDENT_EMAILS = ["student@balqalam.com", "student@databayt.org"]

/** Mirrors the timetable generator's per-teacher weekly cap. */
const MAX_PERIODS_PER_WEEK = 25
/** Mirrors `seedTeacherSubjectExpertise`. */
const TEACHERS_PER_SUBJECT = 3

/** History depth, in school days. */
const HISTORY_DAYS = 5
/** Sections that get full history (participants + attendance). */
const FOCUS_SECTIONS = 3
/** Upper bound on next-day sessions — the cron's own MAX_SLOTS_PER_SCHOOL. */
const MAX_NEXT_DAY_SESSIONS = 150

/** Mirrors attendance-sync.ts. */
const LATE_GRACE_MINUTES = 10
const MIN_PRESENCE_MINUTES = 5

const DEFAULT_TZ = "Africa/Khartoum"
const ID = { select: { id: true } } as const

// ---------------------------------------------------------------------------
// Deterministic randomness — re-runs must reproduce the same demo.
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export async function seedConference(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, timezone: true, preferredLanguage: true },
  })
  if (!school) {
    logWarning("Conference: school not found — skipped")
    return 0
  }
  const tz = school.timezone || DEFAULT_TZ
  const lang = school.preferredLanguage || "ar"

  const term = await prisma.term.findFirst({
    where: { schoolId, isActive: true },
    select: { id: true, yearId: true },
  })
  if (!term) {
    logWarning("Conference: no active term — skipped")
    return 0
  }

  // ── 1. Repairs ──────────────────────────────────────────────────────────
  await repairBreakPeriods(prisma, schoolId)
  const testTeacherId = await topUpExpertise(prisma, schoolId)
  await backfillSlotTeachers(prisma, schoolId, term.id, testTeacherId)

  // ── 2. Policy ───────────────────────────────────────────────────────────
  const sections = await prisma.section.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      homeroomTeacherId: true,
      conferenceOnline: true,
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  })
  if (sections.length === 0) {
    logWarning("Conference: no sections — skipped")
    return 0
  }
  const focus = await pickFocusSections(prisma, schoolId, sections)
  await applyPolicy(prisma, schoolId, sections, focus)

  // ── 3–5. Sessions ───────────────────────────────────────────────────────
  const existing = await prisma.conference.count({
    where: { schoolId, timetableId: { not: null } },
  })
  if (existing > 0 && process.env.SEED_FORCE !== "1") {
    logSuccess("Conference sessions", existing, "already seeded — skipped")
    return existing
  }
  if (existing > 0) {
    // SEED_FORCE: rebuild the demo's sessions. Cascades take participants,
    // events and resources; the VIRTUAL attendance is ours to remove too.
    await prisma.attendance.deleteMany({
      where: { schoolId, method: "VIRTUAL" },
    })
    await prisma.conference.deleteMany({
      where: { schoolId, timetableId: { not: null } },
    })
  }

  const periods = await prisma.period.findMany({
    where: { schoolId, yearId: term.yearId, isBreak: false },
    select: { id: true, name: true, startTime: true, endTime: true },
  })
  const periodById = new Map(periods.map((p) => [p.id, p]))

  const slots = await prisma.timetable.findMany({
    where: {
      schoolId,
      termId: term.id,
      weekOffset: 0,
      sectionId: { not: null },
      teacherId: { not: null },
      period: { isBreak: false },
    },
    select: {
      id: true,
      dayOfWeek: true,
      periodId: true,
      sectionId: true,
      subjectId: true,
      teacherId: true,
      subject: { select: { name: true } },
      section: { select: { name: true } },
      teacher: { select: { userId: true } },
    },
  })
  const teachingDays = [...new Set(slots.map((s) => s.dayOfWeek))].sort()
  if (teachingDays.length === 0) {
    logWarning("Conference: timetable has no teacher-assigned slots — skipped")
    return 0
  }

  // Which sections are online, by the block's own rule (mirrored — the
  // resolver is server-only): section override ?? school default (now true).
  const onlineSections = new Set(
    sections.filter((s) => s.conferenceOnline ?? true).map((s) => s.id)
  )
  const rosterBySection = await loadRosters(prisma, schoolId, [
    ...onlineSections,
  ])

  const history = await seedHistory(prisma, {
    schoolId,
    tz,
    lang,
    slots: slots.filter(
      (s) => focus.has(s.sectionId!) && onlineSections.has(s.sectionId!)
    ),
    periodById,
    teachingDays,
    rosterBySection,
  })

  const next = await seedNextSchoolDay(prisma, {
    schoolId,
    tz,
    lang,
    slots: slots.filter((s) => onlineSections.has(s.sectionId!)),
    periodById,
    teachingDays,
  })

  await seedShowcase(prisma, {
    schoolId,
    tz,
    lang,
    termId: term.id,
    focus,
    sections,
    slots,
    periodById,
    teachingDays,
  })

  const total = history + next
  logSuccess(
    "Conference sessions",
    total,
    `${history} ended · ${next} scheduled`
  )
  return total
}

// ---------------------------------------------------------------------------
// 1. Repairs
// ---------------------------------------------------------------------------

/**
 * `Period.isBreak` reached production on 2026-08-28 with `DEFAULT false` on
 * every existing row, so a break seeded before then reads as teaching time
 * and the materializer would put a live session INTO it. Readers must never
 * infer break-ness from a name (timetable CLAUDE.md); a one-time data repair
 * on rows that predate the column is the exception that rule anticipates.
 */
async function repairBreakPeriods(prisma: PrismaClient, schoolId: string) {
  const { count } = await prisma.period.updateMany({
    where: {
      schoolId,
      isBreak: false,
      OR: [
        { name: { contains: "Break", mode: "insensitive" } },
        { name: { contains: "Lunch", mode: "insensitive" } },
        { name: { contains: "فسحة" } },
        { name: { contains: "استراحة" } },
        { name: { contains: "غداء" } },
      ],
    },
    data: { isBreak: true },
  })
  if (count > 0) logSuccess("Break periods re-flagged", count)
}

/**
 * Every subject the school actually teaches gets `TEACHERS_PER_SUBJECT`
 * qualified teachers. Additive: the original expertise seed is count-guarded
 * and never re-runs, so selections added after it (per-grade catalog rows —
 * the demo's Math alone is ten of them) had nobody qualified. Round-robin by
 * teacher id so re-runs are stable.
 *
 * Returns the test teacher's id (or null) so the caller can route slots to it.
 */
async function topUpExpertise(
  prisma: PrismaClient,
  schoolId: string
): Promise<string | null> {
  const [selections, teachers, existing, testTeacher, testStudent] =
    await Promise.all([
      prisma.subjectSelection.findMany({
        where: { schoolId, isActive: true },
        select: { catalogSubjectId: true, gradeId: true },
      }),
      prisma.teacher.findMany({
        where: { schoolId, employmentStatus: "ACTIVE" },
        select: { id: true },
        orderBy: { id: "asc" },
      }),
      prisma.teacherSubjectExpertise.findMany({
        where: { schoolId },
        select: { teacherId: true, subjectId: true },
      }),
      prisma.teacher.findFirst({
        where: { schoolId, user: { email: { in: TEST_TEACHER_EMAILS } } },
        select: { id: true },
      }),
      prisma.student.findFirst({
        where: { schoolId, user: { email: { in: TEST_STUDENT_EMAILS } } },
        select: { sectionId: true, section: { select: { gradeId: true } } },
      }),
    ])
  if (teachers.length === 0 || selections.length === 0) {
    return testTeacher?.id ?? null
  }

  const holders = new Map<string, Set<string>>()
  for (const e of existing) {
    if (!holders.has(e.subjectId)) holders.set(e.subjectId, new Set())
    holders.get(e.subjectId)!.add(e.teacherId)
  }

  const rows: Array<{
    schoolId: string
    teacherId: string
    subjectId: string
    expertiseLevel: string
  }> = []

  // The test teacher first: qualified for everything the test student's grade
  // takes, so the documented trio (teacher starts · student joins · parent
  // observes) has a real class to meet in.
  const testGradeId = testStudent?.section?.gradeId ?? null
  if (testTeacher && testGradeId) {
    for (const sel of selections) {
      if (sel.gradeId !== testGradeId) continue
      const set = holders.get(sel.catalogSubjectId) ?? new Set()
      if (!set.has(testTeacher.id)) {
        rows.push({
          schoolId,
          teacherId: testTeacher.id,
          subjectId: sel.catalogSubjectId,
          expertiseLevel: "PRIMARY",
        })
        set.add(testTeacher.id)
        holders.set(sel.catalogSubjectId, set)
      }
    }
  }

  const subjectIds = [
    ...new Set(selections.map((s) => s.catalogSubjectId)),
  ].sort()
  const want = Math.min(TEACHERS_PER_SUBJECT, teachers.length)
  let cursor = 0
  for (const subjectId of subjectIds) {
    const set = holders.get(subjectId) ?? new Set()
    let guard = 0
    while (set.size < want && guard < teachers.length) {
      const t = teachers[cursor % teachers.length]
      cursor++
      guard++
      if (set.has(t.id)) continue
      rows.push({
        schoolId,
        teacherId: t.id,
        subjectId,
        expertiseLevel:
          set.size === 0
            ? "PRIMARY"
            : set.size === 1
              ? "SECONDARY"
              : "CERTIFIED",
      })
      set.add(t.id)
    }
    holders.set(subjectId, set)
  }

  if (rows.length > 0) {
    const { count } = await prisma.teacherSubjectExpertise.createMany({
      data: rows,
      skipDuplicates: true,
    })
    logSuccess(
      "Teacher expertise topped up",
      count,
      `${subjectIds.length} subjects covered`
    )
  }
  return testTeacher?.id ?? null
}

/**
 * Put a qualified, free, under-cap teacher on every teacherless slot of the
 * active term. Additive — existing assignments are never moved. The test
 * teacher's slots come first so they land on the test student's section.
 */
async function backfillSlotTeachers(
  prisma: PrismaClient,
  schoolId: string,
  termId: string,
  testTeacherId: string | null
) {
  const [slots, expertise, testStudent] = await Promise.all([
    prisma.timetable.findMany({
      where: { schoolId, termId, weekOffset: 0 },
      select: {
        id: true,
        dayOfWeek: true,
        periodId: true,
        sectionId: true,
        subjectId: true,
        teacherId: true,
        section: { select: { name: true } },
      },
    }),
    prisma.teacherSubjectExpertise.findMany({
      where: { schoolId, teacher: { employmentStatus: "ACTIVE" } },
      select: { teacherId: true, subjectId: true },
      orderBy: [{ teacherId: "asc" }],
    }),
    prisma.student.findFirst({
      where: { schoolId, user: { email: { in: TEST_STUDENT_EMAILS } } },
      select: { sectionId: true },
    }),
  ])

  const open = slots.filter((s) => !s.teacherId && s.subjectId && s.sectionId)
  if (open.length === 0) return

  const load = new Map<string, number>()
  const busy = new Set<string>()
  for (const s of slots) {
    if (!s.teacherId) continue
    load.set(s.teacherId, (load.get(s.teacherId) ?? 0) + 1)
    busy.add(`${s.teacherId}:${s.dayOfWeek}:${s.periodId}`)
  }
  const qualified = new Map<string, string[]>()
  for (const e of expertise) {
    if (!qualified.has(e.subjectId)) qualified.set(e.subjectId, [])
    qualified.get(e.subjectId)!.push(e.teacherId)
  }
  // Test teacher first in every candidate list they qualify for.
  if (testTeacherId) {
    for (const [, list] of qualified) {
      const i = list.indexOf(testTeacherId)
      if (i > 0) {
        list.splice(i, 1)
        list.unshift(testTeacherId)
      }
    }
  }

  const testSection = testStudent?.sectionId ?? null
  open.sort((a, b) => {
    const at = a.sectionId === testSection ? 0 : 1
    const bt = b.sectionId === testSection ? 0 : 1
    if (at !== bt) return at - bt
    return (
      (a.section?.name ?? "").localeCompare(b.section?.name ?? "") ||
      a.dayOfWeek - b.dayOfWeek ||
      a.periodId.localeCompare(b.periodId)
    )
  })

  const byTeacher = new Map<string, string[]>()
  let unfilled = 0
  for (const s of open) {
    const cands = qualified.get(s.subjectId!) ?? []
    const pick = cands.find(
      (t) =>
        (load.get(t) ?? 0) < MAX_PERIODS_PER_WEEK &&
        !busy.has(`${t}:${s.dayOfWeek}:${s.periodId}`)
    )
    if (!pick) {
      unfilled++
      continue
    }
    load.set(pick, (load.get(pick) ?? 0) + 1)
    busy.add(`${pick}:${s.dayOfWeek}:${s.periodId}`)
    if (!byTeacher.has(pick)) byTeacher.set(pick, [])
    byTeacher.get(pick)!.push(s.id)
  }

  let filled = 0
  for (const [teacherId, ids] of byTeacher) {
    const { count } = await prisma.timetable.updateMany({
      where: { id: { in: ids }, schoolId, teacherId: null },
      data: { teacherId },
    })
    filled += count
  }
  logSuccess(
    "Timetable teachers backfilled",
    filled,
    unfilled > 0
      ? `${unfilled} slots still have no qualified free teacher`
      : undefined
  )
}

// ---------------------------------------------------------------------------
// 2. Policy
// ---------------------------------------------------------------------------

type SectionRow = {
  id: string
  name: string
  homeroomTeacherId: string | null
  conferenceOnline: boolean | null
  _count: { students: number }
}

/** The test student's section, then the largest sections — stable order. */
async function pickFocusSections(
  prisma: PrismaClient,
  schoolId: string,
  sections: SectionRow[]
): Promise<Set<string>> {
  const testStudent = await prisma.student.findFirst({
    where: { schoolId, user: { email: { in: TEST_STUDENT_EMAILS } } },
    select: { sectionId: true },
  })
  const focus = new Set<string>()
  if (testStudent?.sectionId) focus.add(testStudent.sectionId)
  const bySize = [...sections].sort(
    (a, b) =>
      b._count.students - a._count.students || a.name.localeCompare(b.name)
  )
  for (const s of bySize) {
    if (focus.size >= FOCUS_SECTIONS) break
    focus.add(s.id)
  }
  return focus
}

async function applyPolicy(
  prisma: PrismaClient,
  schoolId: string,
  sections: SectionRow[],
  focus: Set<string>
) {
  await prisma.school.update({
    where: { id: schoolId },
    data: {
      conferenceOnlineDefault: true,
      conferenceProviderDefault: "livekit",
      conferenceOnlineMode: "timetable",
      conferenceAttendanceSync: true,
      // Honest default: there is no bucket, so nothing records.
      conferenceRecordingDefault: false,
      conferenceMaxConcurrent: 50,
    },
    ...ID,
  })

  // The tri-state on screen: the last two sections by name stay in person
  // (never a focus section), and the first focus section opts in explicitly.
  const inPerson = [...sections]
    .filter((s) => !focus.has(s.id))
    .slice(-2)
    .map((s) => s.id)
  const explicit = [...focus][0]
  await prisma.section.updateMany({
    where: { schoolId, id: { in: inPerson } },
    data: { conferenceOnline: false },
  })
  if (explicit) {
    await prisma.section.update({
      where: { id: explicit },
      data: { conferenceOnline: true },
      ...ID,
    })
  }
  logSuccess(
    "Online policy",
    sections.length - inPerson.length,
    `sections online · ${inPerson.length} in person · LiveKit · attendance sync on`
  )
}

// ---------------------------------------------------------------------------
// Rosters + day math
// ---------------------------------------------------------------------------

type RosterStudent = { id: string; userId: string | null }

async function loadRosters(
  prisma: PrismaClient,
  schoolId: string,
  sectionIds: string[]
): Promise<Map<string, RosterStudent[]>> {
  const students = await prisma.student.findMany({
    where: { schoolId, sectionId: { in: sectionIds } },
    select: { id: true, userId: true, sectionId: true },
    orderBy: { id: "asc" },
  })
  const map = new Map<string, RosterStudent[]>()
  for (const s of students) {
    if (!s.sectionId) continue
    if (!map.has(s.sectionId)) map.set(s.sectionId, [])
    map.get(s.sectionId)!.push({ id: s.id, userId: s.userId })
  }
  return map
}

/** Walk the calendar in the school's zone: previous/next teaching days. */
function schoolDays(
  tz: string,
  from: Date,
  teachingDays: number[],
  count: number,
  direction: -1 | 1
): Date[] {
  const out: Date[] = []
  let cursor = new Date(from)
  let guard = 0
  while (out.length < count && guard < 60) {
    cursor = new Date(cursor.getTime() + direction * 24 * 60 * 60 * 1000)
    guard++
    if (teachingDays.includes(schoolDayOfWeek(tz, cursor))) {
      out.push(new Date(cursor))
    }
  }
  return out
}

type SlotRow = {
  id: string
  dayOfWeek: number
  periodId: string
  sectionId: string | null
  subjectId: string | null
  teacherId: string | null
  subject: { name: string } | null
  section: { name: string } | null
  teacher: { userId: string | null } | null
}
type PeriodRow = { id: string; name: string; startTime: Date; endTime: Date }

function sessionTitle(slot: SlotRow): string {
  return (
    [slot.subject?.name, slot.section?.name].filter(Boolean).join(" · ") ||
    "Live Class"
  )
}

/** Create a session with the tenant-namespaced roomName embedding its own id. */
async function createSession(
  prisma: PrismaClient,
  data: Parameters<PrismaClient["conference"]["create"]>[0]["data"] & {
    schoolId: string
  }
): Promise<string> {
  const created = await prisma.conference.create({ data, ...ID })
  await prisma.conference.update({
    where: { id: created.id },
    data: { roomName: roomNameFor(data.schoolId, created.id) },
    ...ID,
  })
  return created.id
}

// ---------------------------------------------------------------------------
// 3. History
// ---------------------------------------------------------------------------

async function seedHistory(
  prisma: PrismaClient,
  ctx: {
    schoolId: string
    tz: string
    lang: string
    slots: SlotRow[]
    periodById: Map<string, PeriodRow>
    teachingDays: number[]
    rosterBySection: Map<string, RosterStudent[]>
  }
): Promise<number> {
  const days = schoolDays(
    ctx.tz,
    new Date(),
    ctx.teachingDays,
    HISTORY_DAYS,
    -1
  )
  let created = 0
  let participants = 0
  let attendance = 0

  for (const day of days) {
    const dow = schoolDayOfWeek(ctx.tz, day)
    for (const slot of ctx.slots) {
      if (slot.dayOfWeek !== dow || !slot.sectionId || !slot.teacherId) continue
      const period = ctx.periodById.get(slot.periodId)
      if (!period) continue
      const instants = slotInstantsOn(ctx.tz, day, period)
      if (!instants) continue

      const rng = mulberry32(
        hashSeed(`${slot.id}:${instants.scheduledStart.toISOString()}`)
      )
      // A few classes were cancelled — the state exists, show it.
      const cancelled = rng() < 0.05

      const actualStart = new Date(
        instants.scheduledStart.getTime() + Math.floor(rng() * 3) * 60_000
      )
      const actualEnd = new Date(
        instants.scheduledEnd.getTime() - Math.floor(rng() * 4) * 60_000
      )

      const sessionId = await createSession(prisma, {
        schoolId: ctx.schoolId,
        timetableId: slot.id,
        teacherId: slot.teacherId,
        sectionId: slot.sectionId,
        subjectId: slot.subjectId,
        provider: "livekit",
        roomName: `pending-${slot.id}-${instants.scheduledStart.getTime()}`,
        scheduledStart: instants.scheduledStart,
        scheduledEnd: instants.scheduledEnd,
        actualStart: cancelled ? null : actualStart,
        actualEnd: cancelled ? null : actualEnd,
        status: cancelled ? "cancelled" : "ended",
        recordingEnabled: false,
        maxParticipants: 50,
        visibility: "section",
        title: sessionTitle(slot),
        lang: ctx.lang,
      })
      created++
      if (cancelled) continue

      // Presence, by the sync's rules. Rows only for students who joined —
      // the roster, not the participant table, decides who was absent.
      const roster = ctx.rosterBySection.get(slot.sectionId) ?? []
      const partRows: Array<Record<string, unknown>> = []
      const attRows: Array<Record<string, unknown>> = []
      const events: Array<Record<string, unknown>> = []
      const dateObj = new Date(
        Date.UTC(
          actualStart.getUTCFullYear(),
          actualStart.getUTCMonth(),
          actualStart.getUTCDate()
        )
      )
      const lateAfter = actualStart.getTime() + LATE_GRACE_MINUTES * 60_000

      if (slot.teacher?.userId) {
        partRows.push({
          schoolId: ctx.schoolId,
          sessionId,
          userId: slot.teacher.userId,
          role: "HOST",
          status: "left",
          joinedAt: actualStart,
          leftAt: actualEnd,
          durationSeconds: Math.round(
            (actualEnd.getTime() - actualStart.getTime()) / 1000
          ),
        })
      }
      events.push(
        ev(ctx.schoolId, sessionId, "room_started", actualStart, 0),
        ev(
          ctx.schoolId,
          sessionId,
          "participant_joined",
          actualStart,
          1,
          slot.teacher?.userId
        )
      )

      let evSeq = 2
      for (const student of roster) {
        const r = rng()
        let joinedAt: Date | null = null
        let leftAt: Date | null = null
        if (r < 0.82) {
          joinedAt = new Date(
            actualStart.getTime() + Math.floor(rng() * 4) * 60_000
          )
          leftAt = new Date(
            actualEnd.getTime() - Math.floor(rng() * 3) * 60_000
          )
        } else if (r < 0.92) {
          joinedAt = new Date(
            actualStart.getTime() + (11 + Math.floor(rng() * 10)) * 60_000
          )
          leftAt = actualEnd
        } else if (r < 0.96) {
          // Connected and dropped — the presence floor exists for this.
          joinedAt = new Date(actualStart.getTime() + 60_000)
          leftAt = new Date(joinedAt.getTime() + 90_000)
        }

        let status: "PRESENT" | "LATE" | "ABSENT" = "ABSENT"
        if (joinedAt && leftAt) {
          const minutes = (leftAt.getTime() - joinedAt.getTime()) / 60_000
          if (minutes >= MIN_PRESENCE_MINUTES) {
            status = joinedAt.getTime() > lateAfter ? "LATE" : "PRESENT"
          }
          if (student.userId) {
            partRows.push({
              schoolId: ctx.schoolId,
              sessionId,
              userId: student.userId,
              role: "PARTICIPANT",
              status: "left",
              joinedAt,
              leftAt,
              durationSeconds: Math.round(
                (leftAt.getTime() - joinedAt.getTime()) / 1000
              ),
            })
            if (evSeq < 8) {
              events.push(
                ev(
                  ctx.schoolId,
                  sessionId,
                  "participant_joined",
                  joinedAt,
                  evSeq++,
                  student.userId
                ),
                ev(
                  ctx.schoolId,
                  sessionId,
                  "participant_left",
                  leftAt,
                  evSeq++,
                  student.userId
                )
              )
            }
          }
        }
        attRows.push({
          schoolId: ctx.schoolId,
          studentId: student.id,
          date: dateObj,
          status,
          method: "VIRTUAL",
          periodId: period.id,
          periodName: period.name,
          timetableId: slot.id,
          sectionId: slot.sectionId,
          markedBy: null,
          checkInTime: status === "ABSENT" ? null : joinedAt,
          notes: "auto: live-class presence",
        })
      }
      events.push(ev(ctx.schoolId, sessionId, "room_finished", actualEnd, 99))

      if (partRows.length) {
        const r = await prisma.conferenceParticipant.createMany({
          data: partRows as never,
          skipDuplicates: true,
        })
        participants += r.count
      }
      if (attRows.length) {
        const r = await prisma.attendance.createMany({
          data: attRows as never,
          skipDuplicates: true,
        })
        attendance += r.count
      }
      await prisma.conferenceEvent.createMany({
        data: events as never,
        skipDuplicates: true,
      })
    }
  }
  logSuccess(
    "Conference history",
    created,
    `${days.length} school days · ${participants} participants · ${attendance} VIRTUAL attendance rows`
  )
  return created
}

function ev(
  schoolId: string,
  sessionId: string,
  eventType: string,
  occurredAt: Date,
  seq: number,
  actorUserId?: string | null
) {
  return {
    schoolId,
    sessionId,
    eventType,
    occurredAt,
    actorUserId: actorUserId ?? null,
    eventId: `seed-${sessionId}-${eventType}-${seq}`,
    payload: { seed: true },
  }
}

// ---------------------------------------------------------------------------
// 4. Next school day
// ---------------------------------------------------------------------------

async function seedNextSchoolDay(
  prisma: PrismaClient,
  ctx: {
    schoolId: string
    tz: string
    lang: string
    slots: SlotRow[]
    periodById: Map<string, PeriodRow>
    teachingDays: number[]
  }
): Promise<number> {
  const [day] = schoolDays(ctx.tz, new Date(), ctx.teachingDays, 1, 1)
  if (!day) return 0
  const dow = schoolDayOfWeek(ctx.tz, day)

  // One CONFIRMED substitution for the day — a slot whose teacher is NOT the
  // test teacher, covered by a qualified colleague.
  const substitution = await seedSubstitution(
    prisma,
    ctx.schoolId,
    ctx.slots,
    dow,
    day
  )

  const todays = ctx.slots
    .filter((s) => s.dayOfWeek === dow && s.sectionId && s.teacherId)
    .sort((a, b) => {
      const ap = ctx.periodById.get(a.periodId)?.startTime.getTime() ?? 0
      const bp = ctx.periodById.get(b.periodId)?.startTime.getTime() ?? 0
      return ap - bp || a.id.localeCompare(b.id)
    })
    .slice(0, MAX_NEXT_DAY_SESSIONS)

  let created = 0
  for (const slot of todays) {
    const period = ctx.periodById.get(slot.periodId)
    if (!period) continue
    const instants = slotInstantsOn(ctx.tz, day, period)
    if (!instants) continue
    const sub = substitution?.slotId === slot.id ? substitution : null
    const sessionId = await createSession(prisma, {
      schoolId: ctx.schoolId,
      timetableId: slot.id,
      teacherId: sub?.teacherId ?? slot.teacherId!,
      sectionId: slot.sectionId!,
      subjectId: slot.subjectId,
      provider: "livekit",
      roomName: `pending-${slot.id}-${instants.scheduledStart.getTime()}`,
      scheduledStart: instants.scheduledStart,
      scheduledEnd: instants.scheduledEnd,
      status: "scheduled",
      recordingEnabled: false,
      maxParticipants: 50,
      visibility: "section",
      title: sessionTitle(slot),
      lang: ctx.lang,
    })
    const hostUserId = sub?.userId ?? slot.teacher?.userId ?? null
    if (hostUserId) {
      await prisma.conferenceParticipant.upsert({
        where: { sessionId_userId: { sessionId, userId: hostUserId } },
        create: {
          schoolId: ctx.schoolId,
          sessionId,
          userId: hostUserId,
          role: "HOST",
        },
        update: { role: "HOST" },
        ...ID,
      })
    }
    created++
  }
  logSuccess(
    "Conference next school day",
    created,
    `${day.toISOString().slice(0, 10)}${substitution ? " · 1 substitute host" : ""}`
  )
  return created
}

async function seedSubstitution(
  prisma: PrismaClient,
  schoolId: string,
  slots: SlotRow[],
  dow: number,
  day: Date
): Promise<{
  slotId: string
  teacherId: string
  userId: string | null
} | null> {
  const testTeacher = await prisma.teacher.findFirst({
    where: { schoolId, user: { email: { in: TEST_TEACHER_EMAILS } } },
    select: { id: true },
  })
  const candidate = slots.find(
    (s) =>
      s.dayOfWeek === dow &&
      s.teacherId &&
      s.teacherId !== testTeacher?.id &&
      s.subjectId
  )
  if (!candidate?.teacherId || !candidate.subjectId) return null

  const cover = await prisma.teacherSubjectExpertise.findFirst({
    where: {
      schoolId,
      subjectId: candidate.subjectId,
      teacherId: { not: candidate.teacherId },
      teacher: { employmentStatus: "ACTIVE" },
    },
    select: { teacherId: true, teacher: { select: { userId: true } } },
    orderBy: { teacherId: "asc" },
  })
  if (!cover) return null

  const noon = new Date(day)
  noon.setUTCHours(12, 0, 0, 0)
  const absence = await prisma.teacherAbsence.create({
    data: {
      schoolId,
      teacherId: candidate.teacherId,
      startDate: noon,
      endDate: noon,
      absenceType: "SICK",
      isAllDay: true,
      status: "APPROVED",
      reason: "seed: demo substitution",
    },
    ...ID,
  })
  await prisma.substitutionRecord.upsert({
    where: {
      schoolId_originalSlotId_slotDate: {
        schoolId,
        originalSlotId: candidate.id,
        slotDate: noon,
      },
    },
    create: {
      schoolId,
      absenceId: absence.id,
      originalSlotId: candidate.id,
      originalTeacherId: candidate.teacherId,
      substituteTeacherId: cover.teacherId,
      slotDate: noon,
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
    update: { substituteTeacherId: cover.teacherId, status: "CONFIRMED" },
    ...ID,
  })
  return {
    slotId: candidate.id,
    teacherId: cover.teacherId,
    userId: cover.teacher?.userId ?? null,
  }
}

// ---------------------------------------------------------------------------
// 5. Showcase: assembly · lesson + resources · recurring links · a holiday
// ---------------------------------------------------------------------------

async function seedShowcase(
  prisma: PrismaClient,
  ctx: {
    schoolId: string
    tz: string
    lang: string
    termId: string
    focus: Set<string>
    sections: SectionRow[]
    slots: SlotRow[]
    periodById: Map<string, PeriodRow>
    teachingDays: number[]
  }
) {
  const [day] = schoolDays(ctx.tz, new Date(), ctx.teachingDays, 1, 1)
  if (!day) return
  const dow = schoolDayOfWeek(ctx.tz, day)
  const focusId = [...ctx.focus][0]
  const focusSection = ctx.sections.find((s) => s.id === focusId)
  const host =
    focusSection?.homeroomTeacherId ??
    ctx.slots.find((s) => s.sectionId === focusId)?.teacherId ??
    null
  if (!host) return

  // (a) School-wide assembly before first period, LiveKit, visibility=school.
  const firstPeriod = [...ctx.periodById.values()].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  )[0]
  if (firstPeriod) {
    const start = slotInstantsOn(ctx.tz, day, {
      startTime: new Date(firstPeriod.startTime.getTime() - 30 * 60_000),
      endTime: firstPeriod.startTime,
    })
    const title =
      ctx.lang === "ar"
        ? "الطابور الصباحي — تجمّع المدرسة"
        : "Morning assembly — whole school"
    const exists = await prisma.conference.findFirst({
      where: { schoolId: ctx.schoolId, title, visibility: "school" },
      select: { id: true },
    })
    if (!exists && start) {
      await createSession(prisma, {
        schoolId: ctx.schoolId,
        teacherId: host,
        provider: "livekit",
        roomName: `pending-assembly-${start.scheduledStart.getTime()}`,
        scheduledStart: start.scheduledStart,
        scheduledEnd: start.scheduledEnd,
        status: "scheduled",
        recordingEnabled: false,
        maxParticipants: 300,
        visibility: "school",
        title,
        description:
          ctx.lang === "ar"
            ? "كلمة المدير وإعلانات الأسبوع — لكل الطلاب وأولياء الأمور."
            : "Principal's word and the week's announcements — every student and guardian.",
        lang: ctx.lang,
      })
      logSuccess("Conference assembly", 1, "school-wide")
    }
  }

  // (b) The focus section's first session of the day carries the catalog
  // lesson + an exam + an assignment + a link — the four reference kinds.
  const focusSlot = ctx.slots
    .filter(
      (s) => s.sectionId === focusId && s.dayOfWeek === dow && s.subjectId
    )
    .sort(
      (a, b) =>
        (ctx.periodById.get(a.periodId)?.startTime.getTime() ?? 0) -
        (ctx.periodById.get(b.periodId)?.startTime.getTime() ?? 0)
    )[0]
  if (focusSlot?.subjectId) {
    const session = await prisma.conference.findFirst({
      where: {
        schoolId: ctx.schoolId,
        timetableId: focusSlot.id,
        status: "scheduled",
      },
      orderBy: { scheduledStart: "asc" },
      select: { id: true, catalogLessonId: true },
    })
    if (session && !session.catalogLessonId) {
      const [lesson, exam, assignment] = await Promise.all([
        prisma.lesson.findFirst({
          where: {
            chapter: { subjectId: focusSlot.subjectId },
            status: "PUBLISHED",
          },
          orderBy: [
            { chapter: { sequenceOrder: "asc" } },
            { sequenceOrder: "asc" },
          ],
          select: { id: true },
        }),
        prisma.schoolExam.findFirst({
          where: { schoolId: ctx.schoolId, subjectId: focusSlot.subjectId },
          orderBy: { examDate: "desc" },
          select: { id: true },
        }),
        prisma.schoolAssignment.findFirst({
          where: { schoolId: ctx.schoolId, status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        }),
      ])
      await prisma.conference.update({
        where: { id: session.id },
        data: { catalogLessonId: lesson?.id ?? null },
        ...ID,
      })
      const resources: Array<Record<string, unknown>> = []
      if (exam) {
        resources.push({
          schoolId: ctx.schoolId,
          sessionId: session.id,
          schoolExamId: exam.id,
          order: 0,
        })
      }
      if (assignment) {
        resources.push({
          schoolId: ctx.schoolId,
          sessionId: session.id,
          schoolAssignmentId: assignment.id,
          order: 1,
        })
      }
      resources.push({
        schoolId: ctx.schoolId,
        sessionId: session.id,
        url: "https://ed.databayt.org/docs/conference",
        title: ctx.lang === "ar" ? "دليل الحصص المباشرة" : "Live classes guide",
        order: 2,
      })
      await prisma.conferenceResource.createMany({ data: resources as never })
      logSuccess(
        "Conference references",
        resources.length + (lesson ? 1 : 0),
        "lesson · exam · assignment · link"
      )
    }
  }

  // (c) Three recurring external links for the focus section — "set once & reuse".
  const subjects = [
    ...new Set(
      ctx.slots
        .filter((s) => s.sectionId === focusId && s.subjectId)
        .map((s) => s.subjectId!)
    ),
  ].slice(0, 3)
  const codes = ["abcd-efg", "hijk-lmn", "opqr-stu"]
  let links = 0
  for (const [i, subjectId] of subjects.entries()) {
    await prisma.conferenceLink.upsert({
      where: {
        schoolId_subjectId_sectionId_termId: {
          schoolId: ctx.schoolId,
          subjectId,
          sectionId: focusId,
          termId: ctx.termId,
        },
      },
      create: {
        schoolId: ctx.schoolId,
        subjectId,
        sectionId: focusId,
        termId: ctx.termId,
        provider: "external",
        meetingUrl: `https://meet.google.com/demo-${codes[i]}`,
        meetingProvider: "Google Meet",
      },
      update: {},
      ...ID,
    })
    links++
  }
  if (links) {
    logSuccess(
      "Conference recurring links",
      links,
      "external fallback, focus section"
    )
  }

  // (d) One declared holiday ten days out — the closure notice, informing not blanking.
  const holidayDay = schoolDays(
    ctx.tz,
    new Date(),
    ctx.teachingDays,
    10,
    1
  ).pop()
  if (holidayDay) {
    const title =
      ctx.lang === "ar" ? "يوم مفتوح — تجريبي" : "Open day — demo holiday"
    const exists = await prisma.scheduleException.findFirst({
      where: { schoolId: ctx.schoolId, title },
      select: { id: true },
    })
    if (!exists) {
      const noon = new Date(holidayDay)
      noon.setUTCHours(12, 0, 0, 0)
      await prisma.scheduleException.create({
        data: {
          schoolId: ctx.schoolId,
          termId: ctx.termId,
          exceptionType: "HOLIDAY",
          title,
          startDate: noon,
          endDate: noon,
          isAllDay: true,
          affectsAllClasses: true,
        },
        ...ID,
      })
      logSuccess("Conference holiday", 1, noon.toISOString().slice(0, 10))
    }
  }
}
