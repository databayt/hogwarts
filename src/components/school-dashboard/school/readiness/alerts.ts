// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Real-time readiness alerts — the model is the teacher no-show alert
// (live/no-show-core.ts): rows written straight to `notifications` (the
// `createNotification` action rejects students), channels in_app + push, a link
// in `metadata.url`. Once per (rule, person, school-local day): see the guard
// note in alerts-core.ts. Everything here is best-effort and never throws — a
// join or a failed sign-in must not wait on, or fail because of, an alert.
import "server-only"

import { after } from "next/server"

import { db } from "@/lib/db"
import { schoolAndroidApp } from "@/components/school-dashboard/live/android-app"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfInstant,
} from "@/components/school-dashboard/live/day-window"
import { getLabels } from "@/components/translation/person"

import {
  alertKey,
  alertRecipients,
  androidWebPersonNotice,
  androidWebStaffNotice,
  isDemoSchool,
  passwordTroubleNotice,
  PASSWORD_ALERT_WINDOW_MIN,
  READINESS_NOTIFICATION_TYPE,
  shouldAlertPasswordTrouble,
  type AlertRule,
  type Lang,
} from "./alerts-core"

const GUARD_LOOKBACK_MS = 36 * 3_600_000

type Subject = {
  userId: string
  role: string
  name: string
  username: string | null
  className: string | null
  supervisorUserId: string | null
}

type School = {
  id: string
  domain: string | null
  timezone: string
  lang: Lang
}

/** Run after the response when inside a request, else detached. Never throws. */
function detached(fn: () => Promise<unknown>) {
  const run = () =>
    fn().catch((err) => console.error("[readiness-alert] failed", err))
  try {
    after(run)
  } catch {
    void run()
  }
}

async function loadSchool(schoolId: string): Promise<School | null> {
  const s = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, domain: true, timezone: true, preferredLanguage: true },
  })
  if (!s || isDemoSchool(s.domain)) return null
  return {
    id: s.id,
    domain: s.domain,
    timezone: s.timezone || DEFAULT_SCHOOL_TZ,
    lang: s.preferredLanguage === "en" ? "en" : "ar",
  }
}

/** The person, their class and its supervisor. Only teachers and students. */
async function loadSubject(
  school: School,
  where: { id: string } | { username: string } | { email: string }
): Promise<Subject | null> {
  const u = await db.user.findFirst({
    where: {
      schoolId: school.id,
      role: { in: ["TEACHER", "STUDENT"] },
      isSuspended: false,
      ...where,
    },
    select: {
      id: true,
      role: true,
      username: true,
      email: true,
      teacher: { select: { firstName: true, lastName: true } },
      student: {
        select: {
          firstName: true,
          lastName: true,
          section: {
            select: {
              name: true,
              homeroomTeacher: { select: { userId: true } },
            },
          },
        },
      },
    },
  })
  if (!u) return null
  const p = u.teacher ?? u.student
  const name =
    (p ? `${p.firstName} ${p.lastName}`.trim() : "") ||
    u.username ||
    u.email ||
    u.id
  let className = u.student?.section?.name ?? null
  if (className) {
    try {
      const labels = await getLabels([className], school.lang, school.id)
      className = labels.get(className) ?? className
    } catch {
      // keep the stored name
    }
  }
  return {
    userId: u.id,
    role: u.role,
    name,
    username: u.username,
    className,
    supervisorUserId: u.student?.section?.homeroomTeacher?.userId ?? null,
  }
}

async function adminIds(schoolId: string): Promise<string[]> {
  const rows = await db.user.findMany({
    where: { schoolId, role: "ADMIN", isSuspended: false },
    select: { id: true },
  })
  return rows.map((r) => r.id)
}

/** Has this key already fired? Any row of ours carrying it says yes. */
async function alreadyFired(schoolId: string, key: string): Promise<boolean> {
  const row = await db.notification.findFirst({
    where: {
      schoolId,
      type: READINESS_NOTIFICATION_TYPE,
      createdAt: { gte: new Date(Date.now() - GUARD_LOOKBACK_MS) },
      metadata: { path: ["readinessKey"], equals: key },
    },
    select: { id: true },
  })
  return !!row
}

type Row = { userId: string; title: string; body: string; url: string }

async function writeRows(
  school: School,
  key: string,
  kind: string,
  subjectUserId: string,
  rows: Row[]
) {
  if (rows.length === 0) return
  await db.notification.createMany({
    data: rows.map((r) => ({
      schoolId: school.id,
      userId: r.userId,
      type: READINESS_NOTIFICATION_TYPE,
      priority: "normal" as const,
      title: r.title,
      body: r.body,
      lang: school.lang,
      actorId: null,
      channels: ["in_app", "push"] as ("in_app" | "push")[],
      metadata: {
        kind,
        readinessKey: key,
        subjectUserId,
        url: r.url,
        deep_link: r.url,
      },
    })),
  })
}

export type AlertResult = { sent: number; skipped?: string }

// ------------------------------------------------------- android web join ---

/** Await-able core of `alertAndroidWebJoin`; never throws. */
export async function runAndroidWebJoinAlert(args: {
  schoolId: string
  userId: string
  sessionId: string
  now?: Date
}): Promise<AlertResult> {
  try {
    const school = await loadSchool(args.schoolId)
    if (!school) return { sent: 0, skipped: "school" }
    const app = schoolAndroidApp(school.domain, school.lang)
    if (!app) return { sent: 0, skipped: "no_app" }
    const subject = await loadSubject(school, { id: args.userId })
    if (!subject) return { sent: 0, skipped: "subject" }

    const day = schoolDayOfInstant(school.timezone, args.now ?? new Date())
    const key = alertKey("android_web_join", subject.userId, day)
    if (await alreadyFired(school.id, key)) return { sent: 0, skipped: "fired" }

    const { person, staff } = alertRecipients({
      personUserId: subject.userId,
      notifyPerson: true,
      supervisorUserIds: [subject.supervisorUserId],
      adminUserIds: await adminIds(school.id),
    })
    const rows: Row[] = []
    if (person) {
      rows.push({
        userId: person,
        ...androidWebPersonNotice(school.lang, { appName: app.name }),
        url: app.url,
      })
    }
    const staffNotice = androidWebStaffNotice(school.lang, {
      name: subject.name,
      className: subject.className,
    })
    const link = membershipLink(subject)
    for (const userId of staff) rows.push({ userId, ...staffNotice, url: link })
    await writeRows(school, key, "android_web_join", subject.userId, rows)
    return { sent: rows.length }
  } catch (err) {
    console.error("[readiness-alert] android web join", err)
    return { sent: 0, skipped: "error" }
  }
}

/** Fire-and-forget: a web join from an Android browser at a school with its own app. */
export function alertAndroidWebJoin(args: {
  schoolId: string
  userId: string
  sessionId: string
}): void {
  detached(() => runAndroidWebJoinAlert(args))
}

function membershipLink(s: Pick<Subject, "username" | "name">): string {
  return `/school/membership?q=${encodeURIComponent(s.username ?? s.name)}`
}

// -------------------------------------------------------- password trouble ---

/** Await-able core of `alertPasswordTrouble`; never throws. */
export async function runPasswordTroubleAlert(args: {
  schoolId: string
  identifier: string
  now?: Date
}): Promise<AlertResult> {
  try {
    const now = args.now ?? new Date()
    const identifier = args.identifier.trim()
    if (!identifier) return { sent: 0, skipped: "identifier" }

    const since = new Date(now.getTime() - PASSWORD_ALERT_WINDOW_MIN * 60_000)
    const variants = [...new Set([identifier, identifier.toLowerCase()])]
    const failed = await db.loginAttempt.count({
      where: {
        success: false,
        timestamp: { gte: since },
        email: { in: variants },
        OR: [{ schoolId: args.schoolId }, { schoolId: null }],
      },
    })
    if (!shouldAlertPasswordTrouble(failed)) return { sent: 0, skipped: "below" }

    const school = await loadSchool(args.schoolId)
    if (!school) return { sent: 0, skipped: "school" }
    const subject = await loadSubject(school, {
      ...(identifier.includes("@")
        ? { email: identifier.toLowerCase() }
        : { username: identifier }),
    })
    if (!subject) return { sent: 0, skipped: "subject" }

    const day = schoolDayOfInstant(school.timezone, now)
    const key = alertKey("password_trouble", subject.userId, day)
    if (await alreadyFired(school.id, key)) return { sent: 0, skipped: "fired" }

    // The person cannot sign in, so they are not told; their staff are.
    const { staff } = alertRecipients({
      personUserId: subject.userId,
      notifyPerson: false,
      supervisorUserIds: [subject.supervisorUserId],
      adminUserIds: await adminIds(school.id),
    })
    const notice = passwordTroubleNotice(school.lang, {
      name: subject.name,
      className: subject.className,
      count: failed,
    })
    const link = `/school/membership?q=${encodeURIComponent(subject.username ?? identifier)}`
    await writeRows(
      school,
      key,
      "password_trouble",
      subject.userId,
      staff.map((userId) => ({ userId, ...notice, url: link }))
    )
    return { sent: staff.length }
  } catch (err) {
    console.error("[readiness-alert] password trouble", err)
    return { sent: 0, skipped: "error" }
  }
}

/** Fire-and-forget: called after a failed sign-in is logged. */
export function alertPasswordTrouble(args: {
  schoolId: string
  identifier: string
}): void {
  detached(() => runPasswordTroubleAlert(args))
}

export type { AlertRule }
