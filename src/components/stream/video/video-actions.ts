"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkSchoolVideoQuota,
  incrementSchoolVideoUsage,
} from "@/components/stream/lib/quota"
import { isValidVideoUrl } from "@/components/stream/shared/url-validators"
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
    RATE_LIMITS.STREAM_UPLOAD,
    "stream-upload"
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
      select: {
        id: true,
        chapter: {
          select: {
            subject: {
              select: { slug: true },
            },
          },
        },
      },
    })

    if (!lesson) {
      return { status: "error", message: "Lesson not found" }
    }

    // Storage quota: only relevant for self-hosted bytes (external URLs have
    // no fileSize). Skips entirely when no size is provided or quota is unset.
    const fileSize = data.fileSize && data.fileSize > 0 ? data.fileSize : 0
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
        storageKey: data.storageKey?.trim() || null,
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

    revalidatePath(
      `/[lang]/s/[subdomain]/stream/admin/courses/${lesson.chapter.subject.slug}`
    )
    revalidatePath(`/[lang]/s/[subdomain]/stream/settings`)
    revalidatePath(`/[lang]/catalog/approvals`)

    return {
      status: "success",
      message: "Video submitted for review",
      videoId: created.id,
    }
  } catch (error) {
    console.error("Failed to upload lesson video:", error)
    return { status: "error", message: "Failed to upload video" }
  }
}
