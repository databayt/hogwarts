// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The morning readiness digest — the scan behind /api/cron/readiness-digest.
// Hourly: a school whose first class today starts 60-120 minutes ahead gets one
// digest (class supervisors: their class; admins: the school), once per school
// day (guard key `digest:<schoolId>:<date>`, see alerts-core.ts). The demo
// school is skipped. Rows are written directly, like the other readiness alerts.
import "server-only"

import { db } from "@/lib/db"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfInstant,
  schoolDayWindow,
} from "@/components/school-dashboard/live/day-window"
import { getLabels } from "@/components/translation/person"

import {
  DIGEST_MAX_LEAD_MINUTES,
  DIGEST_MIN_LEAD_MINUTES,
  digestDue,
  digestKey,
  planDigest,
  READINESS_NOTIFICATION_TYPE,
  type DigestClass,
  type DigestMember,
  type Lang,
} from "./alerts-core"
import { loadClassReadiness, type MemberReadinessRow } from "./queries"

export type DigestScan = { candidates: number; schools: number; notices: number }

function asMember(r: MemberReadinessRow): DigestMember {
  return {
    userId: r.userId,
    name: r.name,
    role: r.role,
    reasons: r.readiness.reasons,
  }
}

export async function runReadinessDigest(
  now: Date = new Date()
): Promise<DigestScan> {
  const t = now.getTime()
  // Schools with a class starting inside the window — the cheap first cut.
  const near = await db.conference.findMany({
    where: {
      scheduledStart: {
        gte: new Date(t + DIGEST_MIN_LEAD_MINUTES * 60_000),
        lte: new Date(t + DIGEST_MAX_LEAD_MINUTES * 60_000),
      },
      status: { not: "cancelled" },
      isPractice: false,
      deletedAt: null,
      sectionId: { not: null },
      school: { domain: { not: "demo" } },
    },
    select: { schoolId: true },
    distinct: ["schoolId"],
    take: 500,
  })
  if (near.length === 0) return { candidates: 0, schools: 0, notices: 0 }

  let schools = 0
  let notices = 0
  for (const { schoolId } of near) {
    try {
      const n = await digestForSchool(schoolId, now)
      if (n > 0) {
        schools++
        notices += n
      }
    } catch (err) {
      console.error("[readiness-digest] school failed", { schoolId, err })
    }
  }
  return { candidates: near.length, schools, notices }
}

async function digestForSchool(schoolId: string, now: Date): Promise<number> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true, preferredLanguage: true, domain: true },
  })
  if (!school || (school.domain ?? "").toLowerCase() === "demo") return 0
  const tz = school.timezone || DEFAULT_SCHOOL_TZ
  const lang: Lang = school.preferredLanguage === "en" ? "en" : "ar"
  const day = schoolDayOfInstant(tz, now)
  const { start, end } = schoolDayWindow(tz, now)

  const [first, fired] = await Promise.all([
    db.conference.findFirst({
      where: {
        schoolId,
        scheduledStart: { gte: start, lt: end },
        status: { not: "cancelled" },
        isPractice: false,
        deletedAt: null,
        sectionId: { not: null },
      },
      orderBy: { scheduledStart: "asc" },
      select: { scheduledStart: true },
    }),
    db.notification.findFirst({
      where: {
        schoolId,
        type: READINESS_NOTIFICATION_TYPE,
        createdAt: { gte: new Date(now.getTime() - 36 * 3_600_000) },
        metadata: { path: ["readinessKey"], equals: digestKey(schoolId, day) },
      },
      select: { id: true },
    }),
  ])
  if (
    !digestDue({
      firstStart: first?.scheduledStart ?? null,
      now,
      alreadySent: !!fired,
    })
  ) {
    return 0
  }

  const [classes, admins] = await Promise.all([
    loadClassReadiness(schoolId, day, { now }),
    db.user.findMany({
      where: { schoolId, role: "ADMIN", isSuspended: false },
      select: { id: true },
    }),
  ])
  if (classes.length === 0) return 0

  // Section names are stored in the school's language; best-effort other one.
  let labels = new Map<string, string>()
  try {
    labels = await getLabels(
      classes.map((c) => c.sectionName).filter(Boolean),
      lang,
      schoolId
    )
  } catch {
    // keep the stored names
  }

  const digestClasses: DigestClass[] = classes.map((c) => ({
    sectionName: labels.get(c.sectionName) ?? c.sectionName,
    supervisorUserId: c.supervisor?.userId ?? null,
    members: [
      ...c.students.map(asMember),
      ...c.classes.flatMap((k) => (k.teacher ? [asMember(k.teacher)] : [])),
    ],
  }))
  const plan = planDigest({
    lang,
    classes: digestClasses,
    adminUserIds: admins.map((a) => a.id),
  })
  if (plan.length === 0) return 0

  const url = `/school/analysis?date=${day}`
  const key = digestKey(schoolId, day)
  await db.notification.createMany({
    data: plan.map((p) => ({
      schoolId,
      userId: p.userId,
      type: READINESS_NOTIFICATION_TYPE,
      priority: "normal" as const,
      title: p.title,
      body: p.body,
      lang,
      actorId: null,
      channels: ["in_app", "push"] as ("in_app" | "push")[],
      metadata: { kind: p.kind, readinessKey: key, url, deep_link: url },
    })),
  })
  return plan.length
}
