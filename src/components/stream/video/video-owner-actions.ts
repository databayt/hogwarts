"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { invalidateCache } from "@/lib/cloudfront"
import { db } from "@/lib/db"

type ActionResponse<T = void> =
  | { status: "success"; message: string; data?: T }
  | { status: "error"; message: string }

/**
 * Verify the caller owns the video. Returns the video if owned.
 */
async function assertOwnership(videoId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Authentication required" }
  }

  const video = await db.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      userId: true,
      schoolId: true,
      fileSize: true,
      videoUrl: true,
      storageKey: true,
      visibility: true,
      approvalStatus: true,
      catalogLessonId: true,
      lesson: {
        select: {
          chapter: {
            select: {
              subject: { select: { slug: true } },
            },
          },
        },
      },
    },
  })

  if (!video) {
    return { error: "Video not found" }
  }

  // Owner OR platform developer can manage
  const isDev = session.user.role === "DEVELOPER"
  if (video.userId !== session.user.id && !isDev) {
    return { error: "You do not own this video" }
  }

  return { video: video!, userId: session.user.id }
}

/**
 * Toggle video visibility. Owner can change at any time,
 * even after admin approval.
 */
export async function updateVideoVisibility(
  videoId: string,
  visibility: "PRIVATE" | "SCHOOL" | "PUBLIC"
): Promise<ActionResponse> {
  const result = await assertOwnership(videoId)
  if (!("video" in result)) {
    return { status: "error", message: result.error }
  }

  const video = result.video!

  // A PAID video must not be silently un-paywalled through the generic
  // visibility toggle: other users may already have purchased it and there is
  // no refund/migration path here. Removing the paywall has to be a deliberate
  // action via the video's price/paywall settings, not this control.
  if (video.visibility === "PAID") {
    return {
      status: "error",
      message:
        "Paid videos can't be switched here. Remove the paywall in the video's price settings first.",
    }
  }

  try {
    await db.video.update({
      where: { id: videoId },
      data: { visibility },
    })

    revalidatePath("/[lang]/s/[subdomain]/stream")
    return {
      status: "success",
      message: `Visibility changed to ${visibility.toLowerCase()}`,
    }
  } catch (error) {
    console.error("Failed to update video visibility:", error)
    return { status: "error", message: "Failed to update visibility" }
  }
}

/**
 * Delete a video. Owner can delete at any time.
 * This also invalidates any CloudFront cached copies.
 */
export async function deleteOwnVideo(videoId: string): Promise<ActionResponse> {
  const result = await assertOwnership(videoId)
  if (!("video" in result)) {
    return { status: "error", message: result.error }
  }

  const video = result.video!

  try {
    // Delete the DB record (cascades to progress via Video relation)
    await db.video.delete({ where: { id: videoId } })

    // Release the school's storage quota for self-hosted bytes.
    if (video.schoolId && video.fileSize && video.fileSize > 0) {
      try {
        const { decrementSchoolVideoUsage } =
          await import("@/components/stream/lib/quota")
        await decrementSchoolVideoUsage(video.schoolId, video.fileSize)
      } catch (err) {
        // Non-critical — quota counter can be reconciled later.
        console.error("Failed to decrement video storage usage:", err)
      }
    }

    // Invalidate CDN cache if self-hosted
    if (video.storageKey) {
      try {
        await invalidateCache([`/${video.storageKey}`])
      } catch {
        // Non-critical — CDN cache will expire naturally
      }
    }

    revalidatePath("/[lang]/s/[subdomain]/stream")
    return { status: "success", message: "Video deleted" }
  } catch (error) {
    console.error("Failed to delete video:", error)
    return { status: "error", message: "Failed to delete video" }
  }
}

/**
 * Revoke access immediately. Sets visibility to PRIVATE and
 * invalidates CDN cache so the video is no longer accessible.
 */
export async function revokeVideoAccess(
  videoId: string
): Promise<ActionResponse> {
  const result = await assertOwnership(videoId)
  if (!("video" in result)) {
    return { status: "error", message: result.error }
  }

  const video = result.video!

  try {
    await db.video.update({
      where: { id: videoId },
      data: { visibility: "PRIVATE" },
    })

    // Invalidate CDN cache for immediate effect
    if (video.storageKey) {
      try {
        await invalidateCache([`/${video.storageKey}`])
      } catch {
        // Non-critical
      }
    }

    revalidatePath("/[lang]/s/[subdomain]/stream")
    return {
      status: "success",
      message: "Access revoked — video is now private",
    }
  } catch (error) {
    console.error("Failed to revoke video access:", error)
    return { status: "error", message: "Failed to revoke access" }
  }
}

/**
 * Replace the video file URL. Owner can swap the video content
 * while keeping all metadata, progress, and approval status.
 * After replacement, approval resets to PENDING for re-review.
 */
export async function replaceVideoFile(
  videoId: string,
  newVideoUrl: string,
  provider: string,
  durationSeconds?: number
): Promise<ActionResponse> {
  const result = await assertOwnership(videoId)
  if (!("video" in result)) {
    return { status: "error", message: result.error }
  }

  const video = result.video!

  try {
    await db.video.update({
      where: { id: videoId },
      data: {
        videoUrl: newVideoUrl,
        provider,
        durationSeconds: durationSeconds ?? null,
        // Reset approval — admin needs to re-review new content
        approvalStatus: "PENDING",
        approvedBy: null,
        approvedAt: null,
      },
    })

    // Invalidate old CDN cache
    if (video.storageKey) {
      try {
        await invalidateCache([`/${video.storageKey}`])
      } catch {
        // Non-critical
      }
    }

    revalidatePath("/[lang]/s/[subdomain]/stream")
    return {
      status: "success",
      message: "Video replaced — pending re-approval",
    }
  } catch (error) {
    console.error("Failed to replace video:", error)
    return { status: "error", message: "Failed to replace video" }
  }
}

/**
 * Get all videos owned by the current user with full details.
 */
export async function getMyOwnedVideos(): Promise<
  ActionResponse<
    Array<{
      id: string
      title: string
      visibility: string
      approvalStatus: string
      viewCount: number
      likeCount: number
      averageRating: number
      ratingCount: number
      durationSeconds: number | null
      createdAt: Date
      updatedAt: Date
      lessonName: string
      chapterName: string
      courseName: string
      courseSlug: string
    }>
  >
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { status: "error", message: "Authentication required" }
  }

  try {
    const videos = await db.video.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        visibility: true,
        approvalStatus: true,
        viewCount: true,
        likeCount: true,
        averageRating: true,
        ratingCount: true,
        durationSeconds: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            name: true,
            chapter: {
              select: {
                name: true,
                subject: {
                  select: { name: true, slug: true },
                },
              },
            },
          },
        },
      },
    })

    return {
      status: "success",
      message: "Videos fetched",
      data: videos.map((v) => ({
        id: v.id,
        title: v.title,
        visibility: v.visibility,
        approvalStatus: v.approvalStatus,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        averageRating: v.averageRating,
        ratingCount: v.ratingCount,
        durationSeconds: v.durationSeconds,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        lessonName: v.lesson.name,
        chapterName: v.lesson.chapter.name,
        courseName: v.lesson.chapter.subject.name,
        courseSlug: v.lesson.chapter.subject.slug,
      })),
    }
  } catch (error) {
    console.error("Failed to fetch owned videos:", error)
    return { status: "error", message: "Failed to fetch videos" }
  }
}
