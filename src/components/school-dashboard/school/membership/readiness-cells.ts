// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure helpers behind the members table's readiness columns: reason code →
 * dictionary key, attendance percent, relative last-seen, device kind, and the
 * reminder text. No React, no db — unit-tested in
 * `src/tests/school-dashboard/school/membership/readiness-cells.test.ts`.
 *
 * Dictionary keys live flat in the membership namespace as
 * `readiness_<name>` (content.tsx flattens `membership.readiness`).
 */

import type {
  ReadinessLevel,
  ReadinessReason,
} from "../readiness/rules"

type Dict = Record<string, string>

/** Roles that attend classes — everyone else has no attendance to show. */
const CLASS_ROLES = ["STUDENT", "TEACHER"]

export function hasClasses(role: string): boolean {
  return CLASS_ROLES.includes(role)
}

/** Short chip label for a reason. */
export function reasonLabelKey(code: ReadinessReason): string {
  return `readiness_reason_${code}`
}

/** The sentence a tooltip explains the reason with. */
export function reasonHintKey(code: ReadinessReason): string {
  return `readiness_hint_${code}`
}

export function levelLabelKey(level: ReadinessLevel): string {
  return `readiness_level_${level}`
}

export function reasonLabel(t: Dict, code: ReadinessReason): string {
  return t[reasonLabelKey(code)] ?? code.replace(/_/g, " ")
}

export function reasonHint(t: Dict, code: ReadinessReason): string {
  return t[reasonHintKey(code)] ?? reasonLabel(t, code)
}

/** Info-only codes never need a chip next to a level badge. */
export function visibleReasons(reasons: ReadinessReason[]): ReadinessReason[] {
  return reasons.filter((r) => r !== "allowed_web" && r !== "on_app")
}

/** Whole-number percent of classes joined; null when none were expected. */
export function attendancePct(att: {
  expected: number
  joined: number
}): number | null {
  if (!att || att.expected <= 0) return null
  const pct = Math.round((att.joined / att.expected) * 100)
  return Math.max(0, Math.min(100, pct))
}

export type DeviceKind = "app" | "web" | "unknown"

export function deviceKind(client: "app" | "web" | null | undefined): DeviceKind {
  return client === "app" || client === "web" ? client : "unknown"
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
/** Past this many days a plain date reads better than "N days ago". */
const RELATIVE_DAYS_MAX = 14

/**
 * «منذ ٣ أيام» / "3 days ago" for recent activity, a school-local date after two
 * weeks. Null when the person was never seen.
 */
export function relativeLastSeen(
  lastSeenAt: Date | null,
  now: Date,
  lang: string,
  timeZone = "Africa/Khartoum"
): string | null {
  if (!lastSeenAt) return null
  const diff = Math.max(0, now.getTime() - lastSeenAt.getTime())
  const locale = lang === "en" ? "en-US" : "ar"
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  if (diff < MINUTE) return rtf.format(0, "second")
  if (diff < HOUR) return rtf.format(-Math.floor(diff / MINUTE), "minute")
  if (diff < DAY) return rtf.format(-Math.floor(diff / HOUR), "hour")
  const days = Math.floor(diff / DAY)
  if (days <= RELATIVE_DAYS_MAX) return rtf.format(-days, "day")
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ar-SA", {
    numberingSystem: "latn",
    calendar: "gregory",
    dateStyle: "medium",
    timeZone,
  }).format(lastSeenAt)
}

/** Friendly platform name for the web cell. */
export function platformLabel(platform: string | null | undefined): string {
  switch (platform) {
    case "android":
      return "Android"
    case "ios":
      return "iOS"
    case "windows":
      return "Windows"
    case "mac":
      return "Mac"
    case "chromeos":
      return "ChromeOS"
    default:
      return platform ?? ""
  }
}

/** One CSV-safe cell. */
export function csvCell(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

/** Short device text for exports: "App v16" · "Web (Android)" · "". */
export function deviceText(m: {
  deviceClient?: "app" | "web" | null
  devicePlatform?: string | null
  appVersion?: number | null
}): string {
  if (m.deviceClient === "app") {
    return m.appVersion != null ? `App v${m.appVersion}` : "App"
  }
  if (m.deviceClient === "web") {
    const p = platformLabel(m.devicePlatform)
    return p ? `Web (${p})` : "Web"
  }
  return ""
}

/**
 * The reminder sent to a member, built from their reasons. Phrases are the
 * school's words (Sudanese-leaning Arabic), joined into one short message.
 */
export function buildReminderMessage(
  reasons: ReadinessReason[],
  lang: "ar" | "en",
  apkUrl: string
): { title: string; body: string } {
  const ar = lang !== "en"
  const parts: string[] = []
  const has = (r: ReadinessReason) => reasons.includes(r)

  if (has("android_web")) {
    parts.push(
      ar
        ? `افتح الحصص من تطبيق المدرسة: ${apkUrl}`
        : `Open your classes from the school app: ${apkUrl}`
    )
  } else if (has("old_app")) {
    parts.push(
      ar
        ? `حدّث تطبيق المدرسة: ${apkUrl}`
        : `Update the school app: ${apkUrl}`
    )
  }
  if (has("push_off")) {
    parts.push(ar ? "فعّل الإشعارات" : "Turn on notifications")
  }
  if (has("password_trouble")) {
    parts.push(
      ar
        ? "لو نسيت كلمة المرور كلّم مشرفة الصف"
        : "If you forgot your password, talk to your class supervisor"
    )
  }
  if (has("never_signed_in") || has("no_class_recent")) {
    parts.push(
      ar
        ? "حصصك بتبدأ… ادخل من التطبيق"
        : "Your classes are starting… sign in from the app"
    )
  }
  return {
    title: ar ? "تذكير من المدرسة" : "A reminder from your school",
    body: parts.join(ar ? "، " : ". "),
  }
}
