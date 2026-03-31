"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface PendingVideoItem {
  id: string
  title: string
  description: string | null
  videoUrl: string
  provider: string
  durationSeconds: number | null
  visibility: string
  createdAt: Date
  user: {
    id: string
    username: string | null
    email: string | null
    image: string | null
  }
  lesson: {
    name: string
    chapter: {
      name: string
      subject: {
        name: string
        slug: string
      }
    }
  }
}

/**
 * Get all videos pending review for the current school.
 */
export async function getPendingVideos(): Promise<PendingVideoItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  if (!["ADMIN", "DEVELOPER"].includes(session.user.role || "")) return []

  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const videos = await db.video.findMany({
    where: {
      schoolId,
      approvalStatus: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      videoUrl: true,
      provider: true,
      durationSeconds: true,
      visibility: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
        },
      },
      lesson: {
        select: {
          name: true,
          chapter: {
            select: {
              name: true,
              subject: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return videos
}

/**
 * Approve or reject a video with optional notes.
 */
export async function reviewVideo(
  videoId: string,
  decision: "APPROVED" | "REJECTED",
  rejectionReason?: string
): Promise<{ status: "success" | "error"; message: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { status: "error", message: "Not authenticated" }
  }

  if (!["ADMIN", "DEVELOPER"].includes(session.user.role || "")) {
    return { status: "error", message: "Insufficient permissions" }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { status: "error", message: "Missing school context" }
  }

  try {
    const video = await db.video.findFirst({
      where: { id: videoId, schoolId },
      select: { id: true },
    })

    if (!video) {
      return { status: "error", message: "Video not found" }
    }

    await db.video.update({
      where: { id: videoId },
      data: {
        approvalStatus: decision,
        approvedBy: decision === "APPROVED" ? session.user.id : null,
        approvedAt: decision === "APPROVED" ? new Date() : null,
        rejectionReason: decision === "REJECTED" ? rejectionReason : null,
      },
    })

    revalidatePath("/[lang]/s/[subdomain]/stream")
    return {
      status: "success",
      message: `Video ${decision.toLowerCase()}`,
    }
  } catch (error) {
    console.error("Failed to review video:", error)
    return { status: "error", message: "Failed to review video" }
  }
}
