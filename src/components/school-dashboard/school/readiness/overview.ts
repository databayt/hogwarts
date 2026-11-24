// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure helpers behind the admin dashboard's readiness charts and the
 * "needs follow-up" card. No db — `dashboard/queries.ts` feeds them rows.
 */

import { problemReasons } from "./labels"
import type { ReadinessLevel, ReadinessReason } from "./rules"

export type JoinChannel = "app" | "androidWeb" | "desktop"

/**
 * How a class join reached the room: the school's app, an Android browser
 * (what the school wants to move to the app), or a computer/iPhone browser.
 * A join with no client recorded is unknown → null (not counted).
 */
export function joinChannel(
  client: string | null | undefined,
  platform: string | null | undefined
): JoinChannel | null {
  if (client === "app") return "app"
  if (client === "web") return platform === "android" ? "androidWeb" : "desktop"
  return null
}

/** Share of rows whose level is ok, as a whole percent; null with no rows. */
export function okPercent(levels: ReadinessLevel[]): number | null {
  if (levels.length === 0) return null
  const ok = levels.filter((l) => l === "ok").length
  return Math.round((ok / levels.length) * 100)
}

export type AttentionMember = {
  userId: string
  name: string
  username: string | null
  role: string
  sectionName: string | null
  level: ReadinessLevel
  reasons: ReadinessReason[]
}

/**
 * The people to follow up first: bad before warn, more problems first, then by
 * name. ok members never appear.
 */
export function attentionList<
  T extends {
    userId: string
    name: string
    username: string | null
    role: string
    sectionName: string | null
    readiness: { level: ReadinessLevel; reasons: ReadinessReason[] }
  },
>(rows: T[], limit = 8): AttentionMember[] {
  return rows
    .filter((r) => r.readiness.level !== "ok")
    .map((r) => ({
      userId: r.userId,
      name: r.name,
      username: r.username,
      role: r.role,
      sectionName: r.sectionName,
      level: r.readiness.level,
      reasons: problemReasons(r.readiness.reasons),
    }))
    .sort((a, b) => {
      if (a.level !== b.level) return a.level === "bad" ? -1 : 1
      if (a.reasons.length !== b.reasons.length)
        return b.reasons.length - a.reasons.length
      return a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}

/** Link into the membership lane, filtered to one person. */
export function membershipLink(
  lang: string,
  m: Pick<AttentionMember, "level" | "username" | "name">
): string {
  const q = encodeURIComponent(m.username || m.name)
  return `/${lang}/school/membership?status=${m.level}&q=${q}`
}

/** The last `n` YYYY-MM-DD strings ending at `todayISO`, oldest first. */
export function lastDaysISO(todayISO: string, n: number): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(todayISO)
  if (!m) return []
  const base = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(base - i * 86400000).toISOString().slice(0, 10))
  }
  return out
}

/** Attendance rate over a window; null when nothing was expected. */
export function attendanceRatePercent(
  expected: number,
  joined: number
): number | null {
  if (expected <= 0) return null
  return Math.min(100, Math.round((joined / expected) * 1000) / 10)
}
