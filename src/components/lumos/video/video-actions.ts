"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getObjectSize } from "@/lib/s3"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkSchoolVideoQuota,
  incrementSchoolVideoUsage,
} from "@/components/lumos/lib/quota"
import { isValidVideoUrl } from "@/components/lumos/shared/url-validators"
import { prewarm } from "@/components/translation/prewarm"

type ApiResponse = {
  status: "success" | "error"
  message: string
  videoId?: string
}

export type VideoAudience = "PRIVATE" | "SCHOOL" | "PUBLIC"
export type VideoPricing = "FREE" | "PAID"

export interface UploadVideoInput {
  catalogLessonId: string
  title: string
  description?: string
  videoUrl: string
  provider: "YOUTUBE" | "VIMEO" | "SELF_HOSTED" | "OTHER"
  durationSeconds?: number
  audience?: VideoAudience
  pricing?: VideoPricing
  price?: number
  currency?: string
  // Bytes consumed in our storage (self-hosted uploads). null/0 for external
  // URLs (YouTube/Vimeo) which consume no quota.
  fileSize?: number
  // Direct-to-S3 uploads (via /api/blob/presign): the object key + provider.
  // storageKey powers CDN invalidation on delete/revoke/replace.
  storageKey?: string
  storageProvider?: string
}

/**
 * Upload a video for a catalog lesson.
 *
 * Flow:
 * - Proposer picks audience (PRIVATE/SCHOOL/PUBLIC) + pricing (FREE/PAID + price/currency).
 * - Row is written with approvalStatus=PENDING regardless of visibility.
 * - DEVELOPER reviews in /catalog/approvals and can override before approving.
 */
export async function uploadVideo(
  data: UploadVideoInput
): Promise<ApiResponse> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  if (!["ADMIN", "TEACHER", "DEVELOPER"].includes(session.user.role || "")) {
    return { status: "error", message: "Insufficient permissions" }
  }

  if (!schoolId) {
    return { status: "error", message: "School context required" }
  }

  const rl = await checkUserRateLimit(
    session.user.id,
    RATE_LIMITS.LUMOS_UPLOAD,
    "lumos-upload"
  )
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Too many uploads. Please try again shortly.",
    }
  }

  const title = data.title?.trim()
  const videoUrl = data.videoUrl?.trim()
  if (!title || !videoUrl) {
    return { status: "error", message: "Title and video URL are required" }
  }

  // Validate the URL server-side (never trust the client) — a known video host,
  // CDN, or a video file extension over http(s). Blocks stored garbage/phishing
  // hrefs that would surface on the reviewer screen.
  if (!isValidVideoUrl(videoUrl)) {
    return { status: "error", message: "Invalid or unsupported video URL" }
  }

  const audience: VideoAudience = data.audience ?? "SCHOOL"
  const pricing: VideoPricing = data.pricing ?? "FREE"

  // Refuse PAID without a positive price + ISO currency.
  if (pricing === "PAID") {
    if (!data.price || data.price <= 0) {
      return {
        status: "error",
        message: "Paid videos require a price greater than zero",
      }
    }
    if (!data.currency || data.currency.trim().length !== 3) {
      return {
        status: "error",
        message: "Paid videos require a 3-letter currency code (e.g. USD)",
      }
    }
  }

  // PAID overrides audience to the PAID visibility bucket so ranking/gating picks it up.
  const visibility = pricing === "PAID" ? "PAID" : audience

  try {
    // Only allow attaching to a lesson whose subject is PUBLISHED.
    const lesson = await db.lesson.findFirst({
      where: {
        id: data.catalogLessonId,
        chapter: { subject: { status: "PUBLISHED" } },
      },
      select: { id: true },
    })

    if (!lesson) {
      return { status: "error", message: "Lesson not found" }
    }

    // Storage quota: only relevant for self-hosted bytes (external URLs have
    // no fileSize). Skips entirely when no size is provided or quota is unset.
    // For direct uploads the client-claimed size is advisory — HEAD the object
    // for the authoritative byte count (falls back to the claim when S3 is
    // unreachable, never blocks the submit).
    const storageKey = data.storageKey?.trim() || null
    // A client-supplied key is only believable inside the caller's own upload
    // prefix — the same assert `DELETE /api/blob/presign` makes. Without it a
    // teacher could name ANOTHER school's object: `getObjectSize` would then
    // charge that object's bytes to this school's quota, and `deleteOwnVideo`
    // would later CloudFront-invalidate a file this school never uploaded.
    if (storageKey) {
      const allowedPrefix = `stream/${schoolId}/video/`
      if (!storageKey.startsWith(allowedPrefix) || storageKey.includes("..")) {
        console.error(
          "Rejected upload with out-of-scope storageKey:",
          storageKey,
          "expected prefix",
          allowedPrefix
        )
        return { status: "error", message: "Invalid upload reference" }
      }
    }
    let fileSize = data.fileSize && data.fileSize > 0 ? data.fileSize : 0
    if (storageKey) {
      const authoritative = await getObjectSize(storageKey)
      if (authoritative !== null && authoritative > 0) {
        fileSize = authoritative
      }
    }
    if (fileSize > 0) {
      const quota = await checkSchoolVideoQuota(schoolId, fileSize)
      if (!quota.allowed) {
        return {
          status: "error",
          message: "Storage quota exceeded for this school",
        }
      }
    }

    const created = await db.video.create({
      data: {
        catalogLessonId: data.catalogLessonId,
        userId: session.user.id,
        schoolId,
        title,
        description: data.description?.trim() || null,
        videoUrl,
        provider: data.provider,
        durationSeconds: data.durationSeconds ?? null,
        fileSize: fileSize > 0 ? fileSize : null,
        storageKey,
        storageProvider: data.storageProvider?.trim() || null,
        approvalStatus: "PENDING",
        visibility,
        price: pricing === "PAID" ? data.price : null,
        currency: pricing === "PAID" ? data.currency!.toUpperCase() : null,
      },
      select: { id: true },
    })

    // Bump the school's used-bytes counter now that the row exists.
    if (fileSize > 0) {
      await incrementSchoolVideoUsage(schoolId, fileSize)
    }

    // Prewarm translation cache off the response path.
    after(() =>
      prewarm(
        "Video",
        { title, description: data.description?.trim() || null },
        { schoolId }
      )
    )

    // Tell the school's reviewers a submission landed (off the response path;
    // the uploader themself is excluded). Failure must never fail the upload.
    const uploaderId = session.user.id
    after(async () => {
      try {
        const admins = await db.user.findMany({
          where: { schoolId, role: "ADMIN", id: { not: uploaderId } },
          select: { id: true },
        })
        if (admins.length === 0) return
        await db.notification.createMany({
          data: admins.map((admin) => ({
            schoolId,
            userId: admin.id,
            actorId: uploaderId,
            type: "system_alert" as const,
            priority: "normal" as const,
            title: "New video pending review",
            body: `"${title}" was submitted and is waiting in the review queue.`,
            metadata: {
              entityType: "video",
              entityId: created.id,
              url: "/lumos/review",
            },
          })),
        })
      } catch (notifyError) {
        console.error("Failed to notify reviewers of new video:", notifyError)
      }
    })

    // Two rules, both learned the hard way (see ISSUE.md 2026-08-13):
    //
    //  1. `type` is REQUIRED once a path carries a dynamic segment. Every call
    //     here was bare, so NONE of them ever fired — the reviewer queue did
    //     not refresh when a submission landed, and the uploader's own list
    //     did not show the new row until a manual reload.
    //  2. The path must be EITHER a whole route pattern or a fully concrete
    //     pathname — never a blend. `revalidatePath` tags `_N_T_<path>/<type>`
    //     and a page only ever registers its route pattern or its concrete
    //     URL (next/dist/server/lib/implicit-tags.js), so interpolating a real
    //     slug into a bracketed path matches neither and silently does
    //     nothing. Hence `[slug]`/`[lessonId]` below rather than the actual
    //     ids: coarser (every lesson page), but it actually runs.
    //
    // `/lumos/admin/courses/<slug>` was also a path no route has ever served;
    // the lesson lives under `dashboard/[slug]/[lessonId]` (staff) and
    // `courses/[slug]/[lessonId]` (learner).
    revalidatePath(
      "/[lang]/s/[subdomain]/lumos/dashboard/[slug]/[lessonId]",
      "page"
    )
    revalidatePath(
      "/[lang]/s/[subdomain]/lumos/courses/[slug]/[lessonId]",
      "page"
    )
    revalidatePath("/[lang]/s/[subdomain]/lumos/videos", "page")
    revalidatePath("/[lang]/s/[subdomain]/lumos/review", "page")
    revalidatePath("/[lang]/catalog/approvals", "page")

    return {
      status: "success",
      message: "Video uploaded",
      videoId: created.id,
    }
  } catch (error) {
    console.error("Failed to upload lesson video:", error)
    return { status: "error", message: "Failed to upload video" }
  }
}
