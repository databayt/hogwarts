// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Readiness alerts and the daily digest — the pure part: guard keys, who is
// told, the words, and when a digest is due. No database; alerts.ts / digest.ts
// load, send and stay quiet.
//
// The once-only guard. A `notifications` row has a `metadata` JSON column, and
// the no-show alert already dedupes on `metadata.sessionId`. Same here, with one
// key: `metadata.readinessKey`.
//   alert  "<rule>:<userId>:<YYYY-MM-DD>"  (the day is the SCHOOL's, not UTC)
//   digest "digest:<schoolId>:<YYYY-MM-DD>"
// Before sending, the sender looks for any row of the same type + schoolId whose
// `metadata.readinessKey` equals the key. Every recipient of one fire carries the
// same key, so one row is enough to say "already fired".
import type { ReadinessReason } from "./rules"

export const READINESS_NOTIFICATION_TYPE = "system_alert" as const

export type AlertRule = "android_web_join" | "password_trouble"

/** Failed sign-ins inside the window that raise the supervisor alert. */
export const PASSWORD_ALERT_THRESHOLD = 3
export const PASSWORD_ALERT_WINDOW_MIN = 30

/** The digest goes out when the first class starts this far ahead. */
export const DIGEST_MIN_LEAD_MINUTES = 60
export const DIGEST_MAX_LEAD_MINUTES = 120

export type Lang = "ar" | "en"

export function alertKey(rule: AlertRule, userId: string, day: string): string {
  return `${rule}:${userId}:${day}`
}

export function digestKey(schoolId: string, day: string): string {
  return `digest:${schoolId}:${day}`
}

/** The demo school is a sales fixture: never alerted. */
export function isDemoSchool(domain: string | null | undefined): boolean {
  return (domain ?? "").toLowerCase() === "demo"
}

/**
 * Who is told: the person (when the alert is for them too), the class
 * supervisor, then the school ADMINs — each once. A person who is also the
 * supervisor/admin gets the supervisor wording only (they are listed once, in
 * the staff group), so nobody is told twice in one fire.
 */
export function alertRecipients(input: {
  personUserId: string
  /** Send the person their own message (not for a password problem). */
  notifyPerson: boolean
  supervisorUserIds: readonly (string | null | undefined)[]
  adminUserIds: readonly string[]
}): { person: string | null; staff: string[] } {
  const staff = [
    ...new Set(
      [...input.supervisorUserIds, ...input.adminUserIds].filter(
        (u): u is string => !!u && u !== input.personUserId
      )
    ),
  ]
  return { person: input.notifyPerson ? input.personUserId : null, staff }
}

export function shouldAlertPasswordTrouble(failedInWindow: number): boolean {
  return failedInWindow >= PASSWORD_ALERT_THRESHOLD
}

export function whoLabel(name: string, className: string | null): string {
  return className ? `${name} (${className})` : name
}

export function androidWebPersonNotice(
  lang: Lang,
  v: { appName: string }
): { title: string; body: string } {
  return lang === "en"
    ? {
        title: `Open the class from the ${v.appName} app`,
        body: `Open the class from the ${v.appName} app, not the browser. Tap to download the app.`,
      }
    : {
        title: `افتح الحصة من تطبيق ${v.appName}`,
        body: `افتح الحصة من تطبيق ${v.appName} بدل المتصفح. اضغط لتنزيل التطبيق.`,
      }
}

export function androidWebStaffNotice(
  lang: Lang,
  v: { name: string; className: string | null }
): { title: string; body: string } {
  const who = whoLabel(v.name, v.className)
  return lang === "en"
    ? {
        title: "Joined from the Android browser",
        body: `${who} joined the class from the Android browser instead of the app`,
      }
    : {
        title: "دخول من متصفح الأندرويد",
        body: `${who} دخل الحصة من متصفح الأندرويد بدل التطبيق`,
      }
}

export function passwordTroubleNotice(
  lang: Lang,
  v: { name: string; className: string | null; count: number }
): { title: string; body: string } {
  const who = whoLabel(v.name, v.className)
  return lang === "en"
    ? {
        title: "Sign-in trouble",
        body: `${who} cannot sign in. Tried ${v.count} times`,
      }
    : {
        title: "مشكلة في تسجيل الدخول",
        body: `${who} ما قادر يسجّل دخول. جرّب ${v.count} مرات`,
      }
}

// ---------------------------------------------------------------- digest ----

/** Minutes from `now` to `firstStart` (negative once it has started). */
export function minutesUntil(firstStart: Date, now: Date): number {
  return (firstStart.getTime() - now.getTime()) / 60_000
}

/**
 * Is a school's digest due now? The first class today starts 60–120 minutes
 * ahead (a one-hour window against an hourly cron: it is hit once) and the
 * school has not been sent today's digest.
 */
export function digestDue(input: {
  firstStart: Date | null
  now: Date
  alreadySent: boolean
}): boolean {
  if (input.alreadySent || !input.firstStart) return false
  const m = minutesUntil(input.firstStart, input.now)
  return m >= DIGEST_MIN_LEAD_MINUTES && m <= DIGEST_MAX_LEAD_MINUTES
}

export type DigestMember = {
  userId: string
  name: string
  role: string
  reasons: readonly ReadinessReason[]
}

export type DigestCounts = {
  onApp: number
  androidWeb: number
  notJoining: number
  passwordIssues: number
}

/** Counts over a set of members, each person once. */
export function digestCounts(members: readonly DigestMember[]): DigestCounts {
  const seen = new Set<string>()
  const c: DigestCounts = {
    onApp: 0,
    androidWeb: 0,
    notJoining: 0,
    passwordIssues: 0,
  }
  for (const m of members) {
    if (seen.has(m.userId)) continue
    seen.add(m.userId)
    if (m.reasons.includes("on_app")) c.onApp++
    if (m.reasons.includes("android_web")) c.androidWeb++
    if (
      m.reasons.includes("never_signed_in") ||
      m.reasons.includes("no_class_recent")
    ) {
      c.notJoining++
    }
    if (m.reasons.includes("password_trouble")) c.passwordIssues++
  }
  return c
}

/** Teachers with a class today who have not been in one recently. */
export function likelyAbsentTeachers(
  teachers: readonly DigestMember[]
): string[] {
  const out = new Map<string, string>()
  for (const t of teachers) {
    if (t.reasons.includes("no_class_recent")) out.set(t.userId, t.name)
  }
  return [...out.values()]
}

function countsLine(lang: Lang, c: DigestCounts): string {
  return lang === "en"
    ? `${c.onApp} on the app, ${c.androidWeb} on the Android browser, ${c.notJoining} not joining, ${c.passwordIssues} sign-in problems`
    : `${c.onApp} على التطبيق، ${c.androidWeb} متصفح أندرويد، ${c.notJoining} ما بيدخلوا، ${c.passwordIssues} مشاكل دخول`
}

export function supervisorDigestNotice(
  lang: Lang,
  v: { className: string; counts: DigestCounts }
): { title: string; body: string } {
  return lang === "en"
    ? {
        title: `${v.className} readiness today`,
        body: `${v.className} readiness today: ${countsLine(lang, v.counts)}`,
      }
    : {
        title: `جاهزية ${v.className} اليوم`,
        body: `جاهزية ${v.className} اليوم: ${countsLine(lang, v.counts)}`,
      }
}

export function adminDigestNotice(
  lang: Lang,
  v: { counts: DigestCounts; absentTeachers: readonly string[] }
): { title: string; body: string } {
  const absent = v.absentTeachers.join("، ")
  if (lang === "en") {
    return {
      title: "School readiness today",
      body:
        `School readiness today: ${countsLine(lang, v.counts)}` +
        (absent ? `. Teachers likely absent: ${v.absentTeachers.join(", ")}` : ""),
    }
  }
  return {
    title: "جاهزية المدرسة اليوم",
    body:
      `جاهزية المدرسة اليوم: ${countsLine(lang, v.counts)}` +
      (absent ? `. معلمون قد يغيبون: ${absent}` : ""),
  }
}

// ---------------------------------------------------------------- joins -----

/** A class join from a plain Android browser (the app is the way in). */
export function isAndroidWebJoin(
  c: { client?: string | null; platform?: string | null } | null | undefined
): boolean {
  return c?.client === "web" && c?.platform === "android"
}

// ------------------------------------------------------------ digest plan ---

export type DigestClass = {
  sectionName: string
  supervisorUserId: string | null
  /** Students + the class's teachers; counted once per person. */
  members: readonly DigestMember[]
}

export type PlannedNotice = {
  userId: string
  title: string
  body: string
  kind: "class_digest" | "school_digest"
}

/**
 * One notice per class supervisor (their class), one school summary per admin.
 * A person who is an admin gets the school summary only; a supervisor of two
 * classes gets one notice per class. The class counts include students and
 * teachers; the school counts count each person once across classes.
 */
export function planDigest(input: {
  lang: Lang
  classes: readonly DigestClass[]
  adminUserIds: readonly string[]
}): PlannedNotice[] {
  const admins = new Set(input.adminUserIds)
  const out: PlannedNotice[] = []
  for (const c of input.classes) {
    if (!c.supervisorUserId || admins.has(c.supervisorUserId)) continue
    const n = supervisorDigestNotice(input.lang, {
      className: c.sectionName,
      counts: digestCounts(c.members),
    })
    out.push({ userId: c.supervisorUserId, ...n, kind: "class_digest" })
  }
  if (admins.size > 0) {
    const all = input.classes.flatMap((c) => c.members)
    const n = adminDigestNotice(input.lang, {
      counts: digestCounts(all),
      absentTeachers: likelyAbsentTeachers(all.filter((m) => m.role === "TEACHER")),
    })
    for (const userId of admins) out.push({ userId, ...n, kind: "school_digest" })
  }
  return out
}
