// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The ONE definition of a school's instructor policy.
 *
 * Three surfaces decide which instructor's video a student gets: the lesson
 * fetcher (`data/catalog/get-lesson-with-progress.ts`), the mobile subject
 * routes, and the admin roster that configures the policy in the first place.
 * A policy enforced in only one of them is not a policy — it is a settings
 * page that looks like it works. Same discipline as `lesson-quiz.ts`: one
 * module, imported by every side, so they cannot drift.
 *
 * NOT a "use server" module — these are plain helpers imported by server
 * fetchers and route handlers. A directive here would compile each export
 * into a browser-reachable POST stub.
 */
import { cache } from "react"

import { db } from "@/lib/db"

/**
 * An instructor key names who taught a video, in the one vocabulary the whole
 * feature speaks:
 *
 *   "platform"          — platform-featured content (isFeatured, no schoolId)
 *   "teacher:<userId>"  — one individual instructor
 *   "school:<schoolId>" — every instructor attributed to that school
 *
 * The roster lists people, so it groups rows by `instructorKeyOf` — which
 * never returns a `school:` key. `school:` exists for the lock control ("only
 * our own teachers"), and that asymmetry is exactly why matching goes through
 * `videoMatchesKey` and never through `instructorKeyOf(v) === key`.
 */
export type InstructorKey = string

/** Shape both the roster query and the lesson fetcher already select. */
export interface InstructorAttributedVideo {
  userId?: string | null
  user?: { id: string } | null
  schoolId: string | null
  isFeatured: boolean
}

export interface InstructorPolicy {
  /** null = open. Set = prefer this instructor exclusively where covered. */
  lockedKey: InstructorKey | null
  /** null = the platform-first ordering. Set = float this one to the top. */
  defaultKey: InstructorKey | null
  blocked: Set<InstructorKey>
}

export const EMPTY_INSTRUCTOR_POLICY: InstructorPolicy = {
  lockedKey: null,
  defaultKey: null,
  blocked: new Set(),
}

/** Keys the admin surface may write. `school:` is lock-only; see the type doc. */
export const INSTRUCTOR_KEY_PATTERN =
  /^(platform|teacher:[\w-]+|school:[\w-]+)$/

export function isInstructorKey(value: unknown): value is InstructorKey {
  return typeof value === "string" && INSTRUCTOR_KEY_PATTERN.test(value)
}

function userIdOf(video: InstructorAttributedVideo): string | null {
  return video.user?.id ?? video.userId ?? null
}

/**
 * The key a video is listed under in the roster — one row per person, plus the
 * single branded platform row. Never a `school:` key.
 */
export function instructorKeyOf(
  video: InstructorAttributedVideo
): InstructorKey {
  if (video.isFeatured && !video.schoolId) return "platform"
  return `teacher:${userIdOf(video) ?? "unknown"}`
}

/**
 * Does this video belong to the instructor a key names?
 *
 * Deliberately NOT `instructorKeyOf(video) === key`. A video contributed by a
 * school's teacher keys as `teacher:<userId>`, so comparing keys would make a
 * `school:<id>` lock match nothing and degrade silently to "open" — the flip
 * that looks applied and does nothing. Each key type matches on its own
 * attribute instead, which also means blocking `teacher:<uid>` removes that
 * user's school-attributed videos too.
 */
export function videoMatchesKey(
  video: InstructorAttributedVideo,
  key: InstructorKey
): boolean {
  if (key === "platform") return video.isFeatured && !video.schoolId
  if (key.startsWith("teacher:")) return userIdOf(video) === key.slice(8)
  if (key.startsWith("school:")) return video.schoolId === key.slice(7)
  return false
}

/** Every key that could name this video — what the block filter tests against. */
function keysForVideo(video: InstructorAttributedVideo): InstructorKey[] {
  const keys: InstructorKey[] = [instructorKeyOf(video)]
  if (video.schoolId) keys.push(`school:${video.schoolId}`)
  if (video.isFeatured && !video.schoolId) keys.push("platform")
  return keys
}

/**
 * Read a school's policy. React `cache()`-wrapped so the lesson page pays for
 * it once per request even though the fetcher and the roster both ask.
 */
export const getInstructorPolicy = cache(
  async (schoolId: string | null | undefined): Promise<InstructorPolicy> => {
    if (!schoolId) return EMPTY_INSTRUCTOR_POLICY

    const [policy, blocks] = await Promise.all([
      db.schoolInstructorPolicy.findUnique({
        where: { schoolId },
        select: { lockedKey: true, defaultKey: true },
      }),
      db.instructorBlock.findMany({
        where: { schoolId },
        select: { instructorKey: true },
      }),
    ])

    return {
      lockedKey: policy?.lockedKey ?? null,
      defaultKey: policy?.defaultKey ?? null,
      blocked: new Set(blocks.map((b) => b.instructorKey)),
    }
  }
)

/** True when the school has disabled whoever taught this video. */
export function isBlockedVideo(
  video: InstructorAttributedVideo,
  policy: InstructorPolicy
): boolean {
  if (policy.blocked.size === 0) return false
  return keysForVideo(video).some((key) => policy.blocked.has(key))
}

/**
 * Apply the policy to one lesson's candidate videos.
 *
 *   1. drop every video whose instructor the school disabled  (hard filter)
 *   2. lock: keep only matching videos — but only if any survive, so a lesson
 *      the locked instructor never covered falls back to the rest instead of
 *      going blank (a video-less lesson plays the placeholder clip, which
 *      writes no progress and would dent course completion)
 *   3. order: per-subject preference → school default → the caller's own
 *      ranking (isFeatured desc, viewCount desc)
 *
 * Pure and order-stable: callers pass an already-ranked array and get the same
 * array re-ordered, never re-ranked.
 */
export function applyInstructorPolicy<T extends InstructorAttributedVideo>(
  videos: T[],
  policy: InstructorPolicy,
  preference?: {
    preferredSchoolId: string | null
    preferredUserId: string | null
  } | null
): T[] {
  const allowed = videos.filter((v) => !isBlockedVideo(v, policy))

  let candidates = allowed
  if (policy.lockedKey) {
    const locked = allowed.filter((v) => videoMatchesKey(v, policy.lockedKey!))
    if (locked.length > 0) candidates = locked
  }

  // Rank descending: the per-subject preference outranks the school-wide
  // default, which outranks the caller's incoming order.
  const rank = (v: T): number => {
    if (preference && matchesPreference(v, preference)) return 2
    if (policy.defaultKey && videoMatchesKey(v, policy.defaultKey)) return 1
    return 0
  }

  return candidates
    .map((video, index) => ({ video, index, rank: rank(video) }))
    .sort((a, b) => b.rank - a.rank || a.index - b.index)
    .map((entry) => entry.video)
}

function matchesPreference(
  video: InstructorAttributedVideo,
  preference: {
    preferredSchoolId: string | null
    preferredUserId: string | null
  }
): boolean {
  if (preference.preferredSchoolId)
    return video.schoolId === preference.preferredSchoolId
  if (preference.preferredUserId)
    return userIdOf(video) === preference.preferredUserId
  // Both null is the stored form of "platform default".
  return video.isFeatured && !video.schoolId
}

/**
 * The visibility gate for approved lesson videos, shared so the roster counts
 * exactly what a student can reach. PRIVATE is owner-only; a school member
 * additionally sees their school's SCHOOL/PUBLIC/PAID videos; everyone sees
 * PUBLIC/PAID (the payment gate is per user, applied after this).
 */
export function videoVisibilityWhere(
  schoolId: string | null | undefined,
  userId: string | null | undefined
) {
  const arms: Record<string, unknown>[] = [
    { visibility: "PUBLIC" },
    { visibility: "PAID" },
  ]
  if (userId) arms.unshift({ userId })
  if (schoolId)
    arms.push({ schoolId, visibility: { in: ["SCHOOL", "PUBLIC", "PAID"] } })
  return { OR: arms }
}
