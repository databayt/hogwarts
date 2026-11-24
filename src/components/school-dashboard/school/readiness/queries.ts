// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import { schoolTimeStringOf } from "@/lib/timezone"
import { schoolAndroidApp } from "@/components/school-dashboard/live/android-app"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayToInstant,
  schoolDayWindow,
} from "@/components/school-dashboard/live/day-window"

import {
  DEFAULT_MIN_APP_VERSION,
  memberReadiness,
  supervisorCanCover,
  type DeviceInfo,
  type MemberReadiness,
} from "./rules"

/**
 * Readiness reads. Every query is scoped by `schoolId` and batched — one
 * round of parallel reads per call, no N+1.
 *
 * Known limits: failed/successful sign-ins are matched on the identifier as
 * typed (username, email, lower-cased email), so an odd capitalisation of an
 * email is missed; a combined (multi-section) live class counts only for its
 * primary section.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const FAILED_SIGNIN_WINDOW_DAYS = 3

export type MemberReadinessRow = {
  userId: string
  role: string
  name: string
  username: string | null
  sectionId: string | null
  sectionName: string | null
  lastSeenAt: Date | null
  device: DeviceInfo
  /** The device of their latest class join in the window, if any. */
  lastClassJoin: { client: "app" | "web" | null; platform: string | null } | null
  attendance: { expected: number; joined: number }
  failedSignIns3d: number
  pushOn: boolean
  readiness: MemberReadiness
}

export type LoadMemberReadinessOptions = {
  /** Restrict to these users (any role). Default: every TEACHER and STUDENT. */
  userIds?: string[]
  /** Attendance window, in days back from `now`. Default 7. */
  days?: number
  now?: Date
  /** Builds below this are `old_app`. Default `DEFAULT_MIN_APP_VERSION`. */
  minAppVersion?: number
}

function asClient(v: string | null | undefined): "app" | "web" | null {
  return v === "app" || v === "web" ? v : null
}

function fullName(p: { firstName: string; lastName: string } | null) {
  return p ? `${p.firstName} ${p.lastName}`.trim() : null
}

/**
 * Per-person readiness for a school: how they use the platform (user_presence,
 * with the latest tagged class join as a fallback), classes expected vs joined
 * in the window, failed sign-ins in the last 3 days, push, and the verdict.
 */
export async function loadMemberReadiness(
  schoolId: string,
  opts: LoadMemberReadinessOptions = {}
): Promise<MemberReadinessRow[]> {
  const now = opts.now ?? new Date()
  const days = opts.days ?? 7
  const minAppVersion = opts.minAppVersion ?? DEFAULT_MIN_APP_VERSION
  const since = new Date(now.getTime() - days * DAY_MS)
  const failedSince = new Date(now.getTime() - FAILED_SIGNIN_WINDOW_DAYS * DAY_MS)

  const [school, users] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { domain: true },
    }),
    db.user.findMany({
      where: {
        schoolId,
        ...(opts.userIds
          ? { id: { in: opts.userIds } }
          : { role: { in: ["TEACHER", "STUDENT"] } }),
      },
      select: {
        id: true,
        role: true,
        username: true,
        email: true,
        presence: {
          select: {
            lastSeenAt: true,
            lastClient: true,
            lastPlatform: true,
            lastAppVersion: true,
          },
        },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            sectionId: true,
            section: { select: { name: true } },
          },
        },
      },
    }),
  ])
  if (users.length === 0) return []

  const schoolHasOwnApp = schoolAndroidApp(school?.domain, "ar") !== null
  const userIds = users.map((u) => u.id)
  const identifiers = [
    ...new Set(
      users.flatMap((u) =>
        [u.username, u.email, u.email?.toLowerCase()].filter(
          (x): x is string => !!x
        )
      )
    ),
  ]
  const windowSession = {
    scheduledStart: { gte: since, lte: now },
    status: { not: "cancelled" as const },
    isPractice: false,
    deletedAt: null,
  }

  const [
    sectionCounts,
    teacherCounts,
    participants,
    failed,
    lastSuccess,
    pushRows,
  ] = await Promise.all([
    // Classes expected: per section (students) and per teacher.
    db.conference.groupBy({
      by: ["sectionId"],
      where: { schoolId, sectionId: { not: null }, ...windowSession },
      _count: { _all: true },
    }),
    db.conference.groupBy({
      by: ["teacherId"],
      where: { schoolId, ...windowSession },
      _count: { _all: true },
    }),
    // Classes joined (and how): one row per (session, user).
    db.conferenceParticipant.findMany({
      where: {
        schoolId,
        userId: { in: userIds },
        joinedAt: { not: null },
        session: windowSession,
      },
      select: {
        userId: true,
        joinedAt: true,
        client: true,
        platform: true,
        appVersion: true,
      },
    }),
    db.loginAttempt.findMany({
      where: {
        success: false,
        timestamp: { gte: failedSince },
        email: { in: identifiers },
        OR: [{ schoolId }, { schoolId: null }],
      },
      select: { email: true },
    }),
    db.loginAttempt.groupBy({
      by: ["email"],
      where: {
        success: true,
        email: { in: identifiers },
        OR: [{ schoolId }, { schoolId: null }],
      },
      _max: { timestamp: true },
    }),
    db.notificationSubscription.findMany({
      where: {
        schoolId,
        userId: { in: userIds },
        active: true,
        entityType: { startsWith: "fcm_device" },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ])

  // Device fallback for people with no presence row yet: the latest class join
  // that carries a client, any time.
  const needFallback = users.filter((u) => !u.presence?.lastClient).map((u) => u.id)
  const fallbackRows = needFallback.length
    ? await db.conferenceParticipant.findMany({
        where: {
          schoolId,
          userId: { in: needFallback },
          client: { not: null },
        },
        orderBy: { joinedAt: "desc" },
        distinct: ["userId"],
        select: {
          userId: true,
          joinedAt: true,
          client: true,
          platform: true,
          appVersion: true,
        },
      })
    : []

  const expectedBySection = new Map<string, number>()
  for (const r of sectionCounts) {
    if (r.sectionId) expectedBySection.set(r.sectionId, r._count._all)
  }
  const expectedByTeacher = new Map(
    teacherCounts.map((r) => [r.teacherId, r._count._all])
  )

  const joinedBy = new Map<string, number>()
  const latestJoin = new Map<
    string,
    { at: Date; client: string | null; platform: string | null }
  >()
  for (const p of participants) {
    joinedBy.set(p.userId, (joinedBy.get(p.userId) ?? 0) + 1)
    const at = p.joinedAt as Date
    const prev = latestJoin.get(p.userId)
    // Prefer a join that carries a client over a newer one that does not.
    const better =
      !prev ||
      (p.client && !prev.client) ||
      (!!p.client === !!prev.client && at > prev.at)
    if (better) latestJoin.set(p.userId, { at, client: p.client, platform: p.platform })
  }

  const failedByIdentifier = new Map<string, number>()
  for (const f of failed) {
    const k = f.email.toLowerCase()
    failedByIdentifier.set(k, (failedByIdentifier.get(k) ?? 0) + 1)
  }
  const successByIdentifier = new Map<string, Date>()
  for (const s of lastSuccess) {
    const at = s._max.timestamp
    if (!at) continue
    const k = s.email.toLowerCase()
    const prev = successByIdentifier.get(k)
    if (!prev || at > prev) successByIdentifier.set(k, at)
  }
  const pushUsers = new Set(pushRows.map((r) => r.userId))
  const fallbackBy = new Map(fallbackRows.map((r) => [r.userId, r]))

  return users.map((u) => {
    const keys = [u.username, u.email]
      .filter((x): x is string => !!x)
      .map((x) => x.toLowerCase())
    const failedSignIns3d = [...new Set(keys)].reduce(
      (n, k) => n + (failedByIdentifier.get(k) ?? 0),
      0
    )
    const lastLogin = keys
      .map((k) => successByIdentifier.get(k))
      .reduce<Date | null>((a, b) => (b && (!a || b > a) ? b : a), null)

    const joinHit = latestJoin.get(u.id) ?? null
    const fb = fallbackBy.get(u.id)
    const p = u.presence
    const device: DeviceInfo = p?.lastClient
      ? {
          client: asClient(p.lastClient),
          platform: p.lastPlatform,
          appVersion: p.lastAppVersion,
        }
      : fb
        ? {
            client: asClient(fb.client),
            platform: fb.platform,
            appVersion: fb.appVersion,
          }
        : { client: null, platform: null, appVersion: null }

    const seenCandidates = [p?.lastSeenAt, lastLogin, joinHit?.at, fb?.joinedAt]
    const lastSeenAt = seenCandidates.reduce<Date | null>(
      (a, b) => (b && (!a || b > a) ? b : a),
      null
    )

    const expected =
      u.role === "TEACHER"
        ? u.teacher
          ? (expectedByTeacher.get(u.teacher.id) ?? 0)
          : 0
        : u.student?.sectionId
          ? (expectedBySection.get(u.student.sectionId) ?? 0)
          : 0
    const attendance = { expected, joined: joinedBy.get(u.id) ?? 0 }
    const lastClassJoin =
      joinHit && joinHit.client
        ? { client: asClient(joinHit.client), platform: joinHit.platform }
        : null
    const pushOn = pushUsers.has(u.id)

    return {
      userId: u.id,
      role: u.role,
      name: fullName(u.teacher) ?? fullName(u.student) ?? u.username ?? u.email ?? u.id,
      username: u.username,
      sectionId: u.student?.sectionId ?? null,
      sectionName: u.student?.section?.name ?? null,
      lastSeenAt,
      device,
      lastClassJoin,
      attendance,
      failedSignIns3d,
      pushOn,
      readiness: memberReadiness({
        role: u.role,
        lastSeenAt,
        device,
        lastClassJoin,
        attendance,
        failedSignIns3d,
        pushOn,
        schoolHasOwnApp,
        minAppVersion,
      }),
    }
  })
}

export type ClassReadinessSupervisor = MemberReadinessRow & {
  canCover: boolean
}

export type ClassReadiness = {
  sectionId: string
  sectionName: string
  /** The section's homeroom teacher, when one is set and has a login. */
  supervisor: ClassReadinessSupervisor | null
  classes: {
    sessionId: string
    /** "HH:mm" on the school's wall clock. */
    start: string
    subject: string | null
    /** The teacher's readiness; null when the teacher has no login. */
    teacher: MemberReadinessRow | null
  }[]
  students: MemberReadinessRow[]
}

/**
 * Readiness of every section that has a (non-practice, non-cancelled) class on
 * `dateISO` (YYYY-MM-DD, the school's calendar day): the supervisor with
 * `canCover`, each class's teacher, and every student of the section.
 */
export async function loadClassReadiness(
  schoolId: string,
  dateISO: string,
  opts: Pick<LoadMemberReadinessOptions, "days" | "now" | "minAppVersion"> = {}
): Promise<ClassReadiness[]> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true },
  })
  const tz = school?.timezone || DEFAULT_SCHOOL_TZ
  const instant = schoolDayToInstant(tz, dateISO)
  if (!instant) return []
  const { start, end } = schoolDayWindow(tz, instant)

  const sessions = await db.conference.findMany({
    where: {
      schoolId,
      sectionId: { not: null },
      scheduledStart: { gte: start, lt: end },
      status: { not: "cancelled" },
      isPractice: false,
      deletedAt: null,
    },
    orderBy: { scheduledStart: "asc" },
    select: {
      id: true,
      sectionId: true,
      scheduledStart: true,
      subject: { select: { name: true } },
      teacher: { select: { userId: true } },
      section: {
        select: {
          name: true,
          homeroomTeacher: { select: { userId: true } },
        },
      },
    },
  })
  if (sessions.length === 0) return []

  const sectionIds = [...new Set(sessions.map((s) => s.sectionId as string))]
  const students = await db.student.findMany({
    where: { schoolId, sectionId: { in: sectionIds }, userId: { not: null } },
    select: { userId: true, sectionId: true },
  })

  const wanted = new Set<string>()
  for (const s of sessions) {
    if (s.teacher.userId) wanted.add(s.teacher.userId)
    const sup = s.section?.homeroomTeacher?.userId
    if (sup) wanted.add(sup)
  }
  for (const st of students) if (st.userId) wanted.add(st.userId)

  const rows = await loadMemberReadiness(schoolId, {
    ...opts,
    userIds: [...wanted],
  })
  const byUser = new Map(rows.map((r) => [r.userId, r]))

  return sectionIds.map((sectionId) => {
    const own = sessions.filter((s) => s.sectionId === sectionId)
    const section = own[0]?.section
    const supUserId = section?.homeroomTeacher?.userId ?? null
    const supRow = supUserId ? byUser.get(supUserId) : undefined
    return {
      sectionId,
      sectionName: section?.name ?? "",
      supervisor: supRow
        ? { ...supRow, canCover: supervisorCanCover(supRow) }
        : null,
      classes: own.map((s) => ({
        sessionId: s.id,
        start: schoolTimeStringOf(s.scheduledStart, tz),
        subject: s.subject?.name ?? null,
        teacher: s.teacher.userId ? (byUser.get(s.teacher.userId) ?? null) : null,
      })),
      students: students
        .filter((st) => st.sectionId === sectionId && st.userId)
        .map((st) => byUser.get(st.userId as string))
        .filter((r): r is MemberReadinessRow => !!r),
    }
  })
}
