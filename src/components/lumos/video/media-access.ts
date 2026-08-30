// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Protected-media access control for Lumos.
 *
 * Why this module exists
 * ----------------------
 * Lesson videos used to be delivered as permanent, world-readable storage
 * URLs embedded straight into the lesson page. Anyone who saw the page — or
 * guessed a key — could fetch the file forever, from anywhere, with no
 * session. Client-side deterrents (context-menu blocking, `nodownload`) do
 * nothing about that; the URL itself was the leak.
 *
 * So the storage URL never leaves the server any more. The page carries an
 * opaque `/api/lumos/video/<id>` reference, and that route re-authorizes the
 * caller on every request before minting a short-lived signed URL. The
 * authorization here is the single source of truth for "may this user see
 * these bytes" and deliberately mirrors the visibility gate applied by the
 * lesson query in `data/catalog/get-lesson-with-progress.ts` — the two must
 * stay in lockstep, or the page and the bytes disagree.
 *
 * External providers (YouTube/Vimeo) are not ours to protect and pass
 * straight through.
 */

import { db } from "@/lib/db"
import { extractStorageKey } from "@/lib/storage-key"

/** Hosts we embed but do not store, so there is nothing for us to sign. */
const EXTERNAL_VIDEO_HOSTS =
  /(?:^|\.)(?:youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com|wistia\.com|loom\.com)$/i

/**
 * True when the URL points at a third-party player rather than our storage.
 * These keep their original URL — the provider owns access control.
 */
export function isExternallyHostedVideo(url: string | null): boolean {
  if (!url) return false
  try {
    return EXTERNAL_VIDEO_HOSTS.test(new URL(url).hostname)
  } catch {
    return false
  }
}

/**
 * The reference that goes to the browser in place of a storage URL.
 *
 * Relative on purpose: it inherits the tenant's own origin, so the request
 * arrives with the session cookie and the subdomain that resolves the school.
 */
export function buildProtectedVideoUrl(videoId: string): string {
  return `/api/lumos/video/${videoId}`
}

/** Same idea for lesson materials and attachments. */
export function buildProtectedFileUrl(
  kind: "material" | "attachment",
  id: string
): string {
  return `/api/lumos/file/${kind}/${id}`
}

export type MediaAccessDenial =
  | "not-found" // no such row, or it has no self-hosted object
  | "not-approved" // still pending/rejected review
  | "forbidden" // visibility or tenant scope says no
  | "payment-required" // PAID and this user has not bought it

export type MediaAccessResult =
  | { ok: true; storageKey: string; title: string }
  | { ok: false; reason: MediaAccessDenial }

/**
 * Decide whether `userId` may fetch the bytes of `videoId`, and return the
 * storage key to sign when they may.
 *
 * The gate, in the order it is applied:
 * 1. Owner (the uploader) sees their own video at any visibility or approval
 *    state — they need to review what they just proposed.
 * 2. Reviewers see their own school's videos at any approval state. The
 *    review queue is *by definition* PENDING, so without this a reviewer
 *    could open `/lumos/review` and be refused the very video they are being
 *    asked to judge. Mirrors `getSubmittedVideos`' own ADMIN/DEVELOPER +
 *    schoolId gate.
 * 3. Everyone else needs `approvalStatus = APPROVED`.
 * 4. A school that has hidden the video via ContentOverride does not get it,
 *    even when the visibility would otherwise allow it.
 * 5. Visibility: PUBLIC → any signed-in viewer. SCHOOL → members of the
 *    owning school only. PAID → any viewer *with a SUCCESS purchase*.
 *    PRIVATE → owner only, which rule 1 already handled.
 */
export async function resolveVideoAccess({
  videoId,
  userId,
  schoolId,
  role,
}: {
  videoId: string
  userId: string
  schoolId: string | null
  /** Caller's role. Omitted (or non-reviewer) means no review privilege. */
  role?: string | null
}): Promise<MediaAccessResult> {
  const video = await db.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      userId: true,
      schoolId: true,
      videoUrl: true,
      storageKey: true,
      visibility: true,
      approvalStatus: true,
      overrides: schoolId
        ? { where: { schoolId, isHidden: true }, select: { id: true } }
        : false,
    },
  })

  if (!video) return { ok: false, reason: "not-found" }

  // Nothing of ours to serve — an external URL should never have been routed
  // here, and a row with neither key nor recognisable URL has no object.
  const storageKey = video.storageKey || extractStorageKey(video.videoUrl)
  if (!storageKey || isExternallyHostedVideo(video.videoUrl)) {
    return { ok: false, reason: "not-found" }
  }

  const granted = { ok: true as const, storageKey, title: video.title }

  // 1. Owner — always, regardless of visibility or approval state.
  if (video.userId === userId) return granted

  // 2. Reviewers, on their own school's submissions. DEVELOPER reviews the
  //    platform lane (PUBLIC/PAID) and so is not school-scoped; an ADMIN is
  //    only a reviewer for their own school's queue.
  const isReviewer =
    role === "DEVELOPER" ||
    (role === "ADMIN" && !!schoolId && video.schoolId === schoolId)
  if (isReviewer) return granted

  // 3. Everyone else needs an approved video.
  if (video.approvalStatus !== "APPROVED") {
    return { ok: false, reason: "not-approved" }
  }

  // 3. School-level hide wins over any visibility grant.
  if (Array.isArray(video.overrides) && video.overrides.length > 0) {
    return { ok: false, reason: "forbidden" }
  }

  // 4. Visibility.
  switch (video.visibility) {
    case "PUBLIC":
      return granted

    case "SCHOOL":
      return schoolId && video.schoolId === schoolId
        ? granted
        : { ok: false, reason: "forbidden" }

    case "PAID": {
      const purchase = await db.videoPurchase.findUnique({
        where: { userId_videoId: { userId, videoId } },
        select: { status: true },
      })
      return purchase?.status === "SUCCESS"
        ? granted
        : { ok: false, reason: "payment-required" }
    }

    case "PRIVATE":
    default:
      return { ok: false, reason: "forbidden" }
  }
}

/** HTTP status for a denial — kept next to the reasons so they can't drift. */
export function denialStatus(reason: MediaAccessDenial): number {
  switch (reason) {
    case "not-found":
      return 404
    case "payment-required":
      return 402
    case "not-approved":
    case "forbidden":
    default:
      return 403
  }
}
