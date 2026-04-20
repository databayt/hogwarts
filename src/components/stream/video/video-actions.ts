"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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

  const title = data.title?.trim()
  const videoUrl = data.videoUrl?.trim()
  if (!title || !videoUrl) {
    return { status: "error", message: "Title and video URL are required" }
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
    const lesson = await db.lesson.findUnique({
      where: { id: data.catalogLessonId },
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
        approvalStatus: "PENDING",
        visibility,
        price: pricing === "PAID" ? data.price : null,
        currency: pricing === "PAID" ? data.currency!.toUpperCase() : null,
      },
      select: { id: true },
    })

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
