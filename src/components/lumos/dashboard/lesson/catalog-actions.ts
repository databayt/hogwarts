"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { checkUserRateLimit } from "@/lib/rate-limit"
import {
  applyLessonProgress,
  completeLessonCore,
} from "@/components/lumos/lib/progress-core"

type ApiResponse = {
  status: "success" | "error"
  message: string
  /** True once the server's watched-through rule has completed the lesson. */
  completed?: boolean
}

/**
 * Mark a catalog lesson as complete.
 *
 * The write itself lives in `lib/progress-core.ts` (shared with the offline
 * sync route); this action owns the session and the permission decision.
 */
export async function markLessonComplete(
  lessonId: string,
  _slug: string
): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  try {
    const isAdmin = ["ADMIN", "TEACHER", "DEVELOPER"].includes(
      session.user.role || ""
    )

    const outcome = await completeLessonCore({
      userId: session.user.id,
      lessonId,
    })

    if (outcome.status === "notFound") {
      return { status: "error", message: "Lesson not found" }
    }

    if (outcome.status === "noEnrollment") {
      // Admin/teacher can view but we can't track progress without a valid
      // enrollment FK.
      return isAdmin
        ? { status: "success", message: "Progress noted (no enrollment)" }
        : { status: "error", message: "You must be enrolled to track progress" }
    }

    return { status: "success", message: "Progress updated", completed: true }
  } catch (error) {
    console.error("Failed to mark catalog lesson complete:", error)
    return { status: "error", message: "Failed to update progress" }
  }
}

/**
 * Mark a catalog lesson as incomplete.
 */
export async function markLessonIncomplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  try {
    await db.lessonProgress.updateMany({
      where: {
        userId: session.user.id,
        catalogLessonId: lessonId,
      },
      data: {
        isCompleted: false,
        completedAt: null,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/[lang]/s/[subdomain]/lumos/courses/[slug]", "page")
    return { status: "success", message: "Progress updated" }
  } catch (error) {
    console.error("Failed to mark catalog lesson incomplete:", error)
    return { status: "error", message: "Failed to update progress" }
  }
}

/**
 * Get catalog lesson progress.
 */
export async function getLessonProgress(lessonId: string): Promise<{
  isCompleted: boolean
  watchedSeconds: number
  totalSeconds: number | null
}> {
  const session = await auth()

  if (!session?.user) {
    return { isCompleted: false, watchedSeconds: 0, totalSeconds: null }
  }

  const progress = await db.lessonProgress.findUnique({
    where: {
      userId_catalogLessonId: {
        userId: session.user.id,
        catalogLessonId: lessonId,
      },
    },
    select: {
      isCompleted: true,
      watchedSeconds: true,
      totalSeconds: true,
    },
  })

  return {
    isCompleted: progress?.isCompleted ?? false,
    watchedSeconds: progress?.watchedSeconds ?? 0,
    totalSeconds: progress?.totalSeconds ?? null,
  }
}

/**
 * Update video playback progress for resume functionality. Completes the
 * lesson server-side once the position crosses the watched-through mark —
 * see `isWatchedThrough` in `lib/progress-core.ts`.
 */
export async function updateLessonProgress(data: {
  lessonId: string
  watchedSeconds: number
  totalSeconds: number
}): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  // This fires on a playback timer (every few seconds). Throttle per
  // (user, lesson) to ~1 write / 5s so a tampered client can't hammer the DB.
  // Silently skip (return success) when throttled — the next allowed write
  // captures the latest position, so no progress is lost.
  const rl = await checkUserRateLimit(
    session.user.id,
    { windowMs: 5000, maxRequests: 1 },
    `lumos-progress:${data.lessonId}`
  )
  if (!rl.allowed) {
    return { status: "success", message: "Progress throttled" }
  }

  try {
    const outcome = await applyLessonProgress({
      userId: session.user.id,
      lessonId: data.lessonId,
      watchedSeconds: data.watchedSeconds,
      totalSeconds: data.totalSeconds,
    })

    switch (outcome.status) {
      case "notFound":
        return { status: "error", message: "Lesson not found" }
      case "noEnrollment":
        // Admin/teacher previewing without an enrollment — nothing to attach
        // the position to. Not an error the player should surface.
        return { status: "success", message: "Progress noted (no enrollment)" }
      case "stale":
        return { status: "success", message: "Progress already newer" }
      default:
        return {
          status: "success",
          message: "Progress saved",
          completed: outcome.completed,
        }
    }
  } catch (error) {
    console.error("Failed to update catalog lesson progress:", error)
    return { status: "error", message: "Failed to save progress" }
  }
}
