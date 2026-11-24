// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Readiness rules — pure, no db. "Is this person set up to take part in online
 * classes?" answered from facts `queries.ts` gathers. These rules reproduce the
 * hand report used with a real school, one reason code each; the UI maps codes
 * to words, so nothing here is text.
 *
 * Levels
 *  - `bad`  — they cannot or did not take part: `never_signed_in`,
 *             `no_class_recent`, `password_trouble`.
 *  - `warn` — they can, but fragile: `android_web` (on the web although the
 *             school has its own app), `old_app`, `push_off` (teachers: no way
 *             to be told a class is starting).
 *  - `ok`   — nothing wrong. `allowed_web` and `on_app` are information only
 *             and never raise the level.
 */

export type ReadinessLevel = "ok" | "warn" | "bad"

export type ReadinessReason =
  | "never_signed_in"
  | "no_class_recent"
  | "android_web"
  | "allowed_web"
  | "old_app"
  | "password_trouble"
  | "push_off"
  | "on_app"

/** Severity of each code; info codes never lift the level above ok. */
export const REASON_LEVEL: Record<ReadinessReason, ReadinessLevel> = {
  never_signed_in: "bad",
  no_class_recent: "bad",
  password_trouble: "bad",
  android_web: "warn",
  old_app: "warn",
  push_off: "warn",
  allowed_web: "ok",
  on_app: "ok",
}

/** Display order: worst first, info last. */
const REASON_ORDER: ReadinessReason[] = [
  "never_signed_in",
  "password_trouble",
  "no_class_recent",
  "android_web",
  "old_app",
  "push_off",
  "allowed_web",
  "on_app",
]

/** Web on these platforms is fine — only an Android phone is steered to the app. */
export const ALLOWED_WEB_PLATFORMS = ["ios", "windows", "mac", "chromeos"]

/** Failed sign-ins in the last 3 days that count as "password trouble". */
export const PASSWORD_TROUBLE_THRESHOLD = 3

/** Default floor for the Android app build; override per call. */
export const DEFAULT_MIN_APP_VERSION = 15

export type DeviceInfo = {
  client: "app" | "web" | null
  platform: string | null
  appVersion: number | null
}

export type MemberReadinessInput = {
  /** "TEACHER" gets the push check; everyone else skips it. */
  role: string
  /** Last time the person was seen anywhere (activity, sign-in, class join). */
  lastSeenAt: Date | null
  /** The last device they used for anything. */
  device: DeviceInfo | null
  /**
   * The device of their most recent class join, when there is one. The
   * android_web rule reads this (falling back to `device`) because what matters
   * is how they take a CLASS.
   */
  lastClassJoin?: Pick<DeviceInfo, "client" | "platform"> | null
  /** Classes expected of them in the window, and how many they joined. */
  attendance: { expected: number; joined: number }
  /** Failed sign-ins in the last 3 days. */
  failedSignIns3d: number
  /** An active fcm_device subscription exists. */
  pushOn: boolean
  /** The school ships its own Android app (`schoolAndroidApp(...) != null`). */
  schoolHasOwnApp: boolean
  /** Builds below this are `old_app`. */
  minAppVersion?: number
}

export type MemberReadiness = {
  level: ReadinessLevel
  reasons: ReadinessReason[]
}

const LEVEL_RANK: Record<ReadinessLevel, number> = { ok: 0, warn: 1, bad: 2 }

export function memberReadiness(input: MemberReadinessInput): MemberReadiness {
  const found = new Set<ReadinessReason>()
  const min = input.minAppVersion ?? DEFAULT_MIN_APP_VERSION
  const device = input.device
  const join = input.lastClassJoin ?? device

  if (!input.lastSeenAt) found.add("never_signed_in")

  if (input.attendance.expected >= 1 && input.attendance.joined === 0) {
    found.add("no_class_recent")
  }

  if (
    input.schoolHasOwnApp &&
    join?.client === "web" &&
    join.platform === "android"
  ) {
    found.add("android_web")
  }

  if (
    device?.client === "web" &&
    device.platform &&
    ALLOWED_WEB_PLATFORMS.includes(device.platform)
  ) {
    found.add("allowed_web")
  }

  if (device?.client === "app") {
    found.add("on_app")
    if (device.appVersion != null && device.appVersion < min) {
      found.add("old_app")
    }
  }

  if (input.failedSignIns3d >= PASSWORD_TROUBLE_THRESHOLD) {
    found.add("password_trouble")
  }

  if (input.role === "TEACHER" && !input.pushOn) found.add("push_off")

  const reasons = REASON_ORDER.filter((r) => found.has(r))
  let level: ReadinessLevel = "ok"
  for (const r of reasons) {
    if (LEVEL_RANK[REASON_LEVEL[r]] > LEVEL_RANK[level]) level = REASON_LEVEL[r]
  }
  return { level, reasons }
}

/**
 * Can this person stand in for a teacher who did not show? On the app or on an
 * allowed web platform, push on, and no password trouble — a supervisor must be
 * reachable AND able to open the room.
 */
export function supervisorCanCover(member: {
  readiness: Pick<MemberReadiness, "reasons">
  pushOn: boolean
}): boolean {
  const r = member.readiness.reasons
  return (
    (r.includes("on_app") || r.includes("allowed_web")) &&
    member.pushOn &&
    !r.includes("password_trouble")
  )
}

/** Worst level of a group (a class is as ready as its weakest required member). */
export function worstLevel(levels: ReadinessLevel[]): ReadinessLevel {
  let worst: ReadinessLevel = "ok"
  for (const l of levels) if (LEVEL_RANK[l] > LEVEL_RANK[worst]) worst = l
  return worst
}
