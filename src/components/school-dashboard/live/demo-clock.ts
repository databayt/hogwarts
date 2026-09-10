// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The demo tenant's three clock-straddling sessions — and the read-time repair
 * that keeps them true.
 *
 * The /live landing is the one page in the block whose whole subject is NOW:
 * a class that is running, one nearly over, one about to begin. Every other
 * fixture the conference seed writes is dated — history behind, tomorrow
 * ahead — so without these three rows the page is correct and empty, which on
 * a demo reads as a broken block.
 *
 * Rows dated "now" go stale within the hour. That is inherent, not a defect;
 * what WAS a defect is that nothing ever refreshed them. The seed wrote them
 * once and moved on, so the demo was live for forty-five minutes after a seed
 * and blank for the days between — and on production, where the seed has not
 * run since August and `end-stale-live-classes` sweeps a stranded `live` row
 * to `ended` after thirty minutes, the page had no session at all.
 *
 * So the refresh lives HERE rather than only in `prisma/seeds`, and the /live
 * page calls it on a demo tenant before it reads. A cron would work too and is
 * a reasonable backstop later; it is deliberately not the mechanism, because a
 * Cloudflare trigger fires on its own schedule (and took roughly nineteen
 * hours to start firing here once) while a page that repairs what it is about
 * to render is true the first time anybody looks.
 *
 * Slot-less on purpose. Anchoring these to timetable slots at shifted times
 * would put rows in the materializer's identity space that do not match the
 * slot they claim, and the sweep would then be entitled to create a duplicate
 * beside each one.
 */

import type { PrismaClient } from "@prisma/client"

import { db } from "@/lib/db"

import { roomNameFor } from "./livekit/room-naming"

/** Any Prisma client — the seed passes its own, the app passes the singleton. */
type Client = Pick<
  PrismaClient,
  "conference" | "conferenceParticipant" | "school" | "student" | "term"
> & {
  timetable: PrismaClient["timetable"]
  lesson: PrismaClient["lesson"]
}

const ID = { select: { id: true } } as const

/**
 * The documented demo student. Their section is what the three rows are
 * pinned to — see `pickSlots`.
 */
const TEST_STUDENT_EMAILS = ["student@balqalam.com", "student@databayt.org"]

/**
 * The ids the showcase owns, so a re-run replaces its own three rows rather
 * than piling up more.
 *
 * Fixed rather than generated, and derived from the school id so two tenants
 * never collide. Nothing requires a conference id to be a cuid — it is the URL
 * and the lookup key — and `roomNameFor` splits on its own `-lc-` separator,
 * which these do not contain, so the room name still parses. The demo gains
 * something from it too: the showcase URL survives a refresh, where a
 * delete-and-create would hand out three new ones every time.
 */
export function demoClockIds(schoolId: string): string[] {
  return [0, 1, 2].map((i) => `clockshow${i}${schoolId}`)
}

/** Minutes from now, as a date. */
const at = (now: number, minutes: number) => new Date(now + minutes * 60_000)

/**
 * The three shapes, relative to the moment they are written.
 *
 * Between them they cover the three phases the card could otherwise never
 * render — "started", "about to finish" and "starting soon" — which is the
 * whole reason these rows exist.
 */
function shapesFor(now: number) {
  return [
    // Running, comfortably mid-lesson: "started", with a minute count.
    { start: at(now, -20), end: at(now, 25), live: true },
    // Running, nearly over: "about to finish".
    { start: at(now, -40), end: at(now, 8), live: true },
    // Not yet begun, inside the fifteen-minute window: "starting soon".
    { start: at(now, 10), end: at(now, 55), live: false },
  ]
}

type ClockRow = {
  id: string
  status: string
  scheduledStart: Date
  scheduledEnd: Date
}

/**
 * Whether the three rows still say what they were written to say.
 *
 * Not "were they written recently" — the question is whether each row would
 * still RENDER its intended phase, which is what a reader sees. A live row
 * whose end has passed shows a clamped "45 of 45 minutes" forever; a "soon"
 * row whose start has passed drops out of the upcoming query entirely, since
 * that query takes `scheduledStart >= now`. Either is stale even if the row
 * was written a minute ago.
 *
 * A row swept to `ended` by `end-stale-live-classes` fails the status check,
 * which is how production recovers from its own backstop cron.
 */
export function demoClockIsStale(
  rows: ClockRow[],
  schoolId: string,
  now: Date = new Date()
): boolean {
  const ids = demoClockIds(schoolId)
  if (rows.length < ids.length) return true

  const byId = new Map(rows.map((r) => [r.id, r]))
  const t = now.getTime()

  return shapesFor(t).some((shape, index) => {
    const row = byId.get(ids[index])
    if (!row) return true
    if (shape.live) {
      return (
        row.status !== "live" ||
        row.scheduledStart.getTime() > t ||
        row.scheduledEnd.getTime() <= t
      )
    }
    return row.status !== "scheduled" || row.scheduledStart.getTime() <= t
  })
}

const SLOT_WHERE = {
  weekOffset: 0,
  sectionId: { not: null },
  subjectId: { not: null },
  teacherId: { not: null },
  period: { isBreak: false },
} as const

const SLOT_SELECT = {
  id: true,
  sectionId: true,
  subjectId: true,
  teacherId: true,
  subject: { select: { name: true } },
  section: { select: { name: true } },
  teacher: { select: { userId: true } },
} as const

type Slot = {
  id: string
  sectionId: string | null
  subjectId: string | null
  teacherId: string | null
  subject: { name: string } | null
  section: { name: string } | null
  teacher: { userId: string | null } | null
}

function sessionTitle(slot: Slot): string {
  return (
    [slot.subject?.name, slot.section?.name].filter(Boolean).join(" · ") ||
    "Live Class"
  )
}

/**
 * A lesson of this subject that actually says what it covers.
 *
 * The room card composes its paragraph from the lesson's synopsis, and roughly
 * half the catalog's lessons carry none — so a showcase row that drew an
 * undescribed lesson demonstrated the card with one line where the design has
 * three. Falls back to any published lesson, then to null, which leaves the
 * row for the seed's ordinary lesson walk to fill.
 */
async function describedLessonFor(
  prisma: Client,
  subjectId: string | null
): Promise<string | null> {
  if (!subjectId) return null
  const order = [
    { chapter: { sequenceOrder: "asc" as const } },
    { sequenceOrder: "asc" as const },
  ]
  const described = await prisma.lesson.findFirst({
    where: {
      chapter: { subjectId },
      status: "PUBLISHED",
      description: { not: null },
    },
    orderBy: order,
    ...ID,
  })
  if (described) return described.id
  const any = await prisma.lesson.findFirst({
    where: { chapter: { subjectId }, status: "PUBLISHED" },
    orderBy: order,
    ...ID,
  })
  return any?.id ?? null
}

/**
 * Three slots for the three shapes — all in the DEMO STUDENT's own section,
 * and of three different subjects.
 *
 * This is the correction that made the strip whole. The landing's strip is a
 * lead plus a two-up, and a student's page is section-scoped: rows outside
 * their own section are filtered away before they reach it. The previous pick
 * deliberately spread the three rows across DISTINCT SECTIONS so the cards
 * would not all read as the same class — which is right for an admin, who
 * sees every section, and leaves the student, whose page this mainly is, with
 * exactly one lonely lead and two empty halves. Distinct SUBJECTS inside one
 * section buys the same variety without costing the student two thirds of the
 * page.
 *
 * The wider sample is still read, as a fallback: a demo whose student section
 * carries fewer than three teachable slots gets a filled strip for an admin
 * rather than none for anybody.
 */
async function pickSlots(
  prisma: Client,
  schoolId: string,
  termId: string
): Promise<Slot[]> {
  const where = { ...SLOT_WHERE, schoolId, termId }

  const student = await prisma.student.findFirst({
    where: { schoolId, user: { email: { in: TEST_STUDENT_EMAILS } } },
    select: { sectionId: true },
  })

  const [own, sample] = await Promise.all([
    student?.sectionId
      ? prisma.timetable.findMany({
          where: { ...where, sectionId: student.sectionId },
          select: SLOT_SELECT,
          take: 40,
        })
      : Promise.resolve([] as Slot[]),
    prisma.timetable.findMany({ where, select: SLOT_SELECT, take: 60 }),
  ])

  // Of the student's own subjects, the ones whose curriculum is actually
  // WRITTEN go first — same reason `describedLessonFor` exists.
  const described = new Set(
    (
      await prisma.lesson.findMany({
        where: {
          status: "PUBLISHED",
          description: { not: null },
          chapter: {
            subjectId: {
              in: [
                ...new Set(
                  own
                    .map((slot) => slot.subjectId)
                    .filter((id): id is string => Boolean(id))
                ),
              ],
            },
          },
        },
        select: { chapter: { select: { subjectId: true } } },
        distinct: ["chapterId"],
      })
    ).map((lesson) => lesson.chapter.subjectId)
  )

  const ordered = [
    ...own.filter((s) => s.subjectId && described.has(s.subjectId)),
    ...own.filter((s) => !s.subjectId || !described.has(s.subjectId)),
    // Only reached when the student's own section cannot fill three rows.
    ...sample.filter((s) => !own.some((o) => o.id === s.id)),
  ]

  const picked: Slot[] = []
  const seenSubjects = new Set<string>()
  for (const slot of ordered) {
    if (seenSubjects.has(slot.subjectId!)) continue
    seenSubjects.add(slot.subjectId!)
    picked.push(slot)
    if (picked.length === 3) break
  }
  // A section with fewer than three distinct subjects repeats one rather than
  // rendering a short strip.
  while (picked.length < 3 && ordered.length > 0) {
    picked.push(ordered[picked.length % ordered.length])
  }
  return picked.length === 3 ? picked : []
}

/**
 * Write (or rewrite) the three rows so they straddle the clock right now.
 *
 * `upsert` on the fixed ids rather than delete-and-create: two page loads can
 * reach this at the same moment, and the second create would then collide on
 * the primary key. Returns how many rows it wrote, 0 when the school has no
 * usable timetable — which is a real answer on a tenant that was never seeded,
 * not an error.
 */
export async function refreshDemoClock(
  prisma: Client,
  ctx: { schoolId: string; lang?: string; termId?: string }
): Promise<number> {
  const { schoolId } = ctx

  let lang = ctx.lang
  let termId = ctx.termId
  if (!lang || !termId) {
    const [school, term] = await Promise.all([
      lang
        ? Promise.resolve(null)
        : prisma.school.findUnique({
            where: { id: schoolId },
            select: { preferredLanguage: true },
          }),
      termId
        ? Promise.resolve(null)
        : prisma.term.findFirst({
            where: { schoolId, isActive: true },
            ...ID,
          }),
    ])
    lang = lang ?? school?.preferredLanguage ?? "ar"
    termId = termId ?? term?.id
  }
  if (!termId) return 0

  const slots = await pickSlots(prisma, schoolId, termId)
  if (slots.length < 3) return 0

  const ids = demoClockIds(schoolId)
  const shapes = shapesFor(Date.now())

  for (const [index, shape] of shapes.entries()) {
    const slot = slots[index]
    const sessionId = ids[index]
    const data = {
      schoolId,
      teacherId: slot.teacherId!,
      sectionId: slot.sectionId!,
      subjectId: slot.subjectId,
      provider: "livekit" as const,
      roomName: roomNameFor(schoolId, sessionId),
      scheduledStart: shape.start,
      scheduledEnd: shape.end,
      actualStart: shape.live ? shape.start : null,
      // A rewrite must clear the end a sweep may have written, or the row
      // would carry an `actualEnd` from a life it no longer has.
      actualEnd: null,
      status: shape.live ? ("live" as const) : ("scheduled" as const),
      recordingEnabled: false,
      maxParticipants: 50,
      visibility: "section" as const,
      title: sessionTitle(slot),
      // No description. The card composes its paragraph from the teacher and
      // the anchored lesson; a session's own blurb is what the wizard writes
      // and a materialized slot writes none, so these read like the rest.
      lang,
      catalogLessonId: await describedLessonFor(prisma, slot.subjectId),
    }

    await prisma.conference.upsert({
      where: { id: sessionId },
      create: { id: sessionId, ...data },
      update: data,
      ...ID,
    })

    const hostUserId = slot.teacher?.userId ?? null
    if (hostUserId) {
      await prisma.conferenceParticipant.upsert({
        where: { sessionId_userId: { sessionId, userId: hostUserId } },
        create: { schoolId, sessionId, userId: hostUserId, role: "HOST" },
        update: { role: "HOST" },
        ...ID,
      })
    }
  }

  return shapes.length
}

/**
 * How long a refresh that produced nothing is trusted before being retried.
 *
 * A tenant with no timetable returns 0 from every call, and without this the
 * /live page would pay for that discovery on every single request. Per
 * process, so a restart or a second instance retries immediately — which is
 * the right trade for a value that is only ever an optimization.
 */
const EMPTY_RETRY_MS = 5 * 60_000
const lastEmptyAttempt = new Map<string, number>()

/**
 * The read-time repair, for the /live page.
 *
 * Cheap on the common path: one indexed read of three rows by primary key,
 * and a rewrite only when they no longer say what they were written to say.
 * Demo tenants only — a real school's sessions are its own, and inventing
 * live classes inside one would be a lie about its day.
 *
 * Never throws. The landing already treats its own session read as an
 * accelerator rather than as the page, and a repair that could take the block
 * down would be worse than the staleness it fixes.
 */
export async function ensureDemoClock(schoolId: string): Promise<void> {
  try {
    const rows = await db.conference.findMany({
      where: { schoolId, id: { in: demoClockIds(schoolId) } },
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    })
    if (!demoClockIsStale(rows, schoolId)) return

    const backoff = lastEmptyAttempt.get(schoolId)
    if (backoff && Date.now() - backoff < EMPTY_RETRY_MS) return

    const written = await refreshDemoClock(db, { schoolId })
    if (written === 0) lastEmptyAttempt.set(schoolId, Date.now())
    else lastEmptyAttempt.delete(schoolId)
  } catch (error) {
    console.error("[LiveLanding] Could not refresh the demo clock:", error)
  }
}
