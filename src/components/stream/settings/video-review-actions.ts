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
 *
 * Governance: the school lane may only APPROVE videos whose surface stays
 * inside the school (PRIVATE/SCHOOL). PUBLIC and PAID videos surface across
 * every school, so their approval belongs to the platform catalog review
 * (/catalog/approvals, DEVELOPER) — a school admin can still REJECT them.
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

  const role = session.user.role || ""
  if (!["ADMIN", "DEVELOPER"].includes(role)) {
    return { status: "error", message: "Insufficient permissions" }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { status: "error", message: "Missing school context" }
  }

  try {
    // Tenant-scoped read first — we need visibility (platform gate) and the
    // owner (notification) anyway, and it keeps "not found in this school"
    // indistinguishable from "doesn't exist".
    const video = await db.video.findFirst({
      where: { id: videoId, schoolId },
      select: { id: true, title: true, userId: true, visibility: true },
    })

    if (!video) {
      return { status: "error", message: "Video not found" }
    }

    if (
      decision === "APPROVED" &&
      ["PUBLIC", "PAID"].includes(video.visibility) &&
      role !== "DEVELOPER"
    ) {
      return {
        status: "error",
        message:
          "Public and paid videos are approved by the platform catalog team",
      }
    }

    // Tenant-scoped write: schoolId stays in the WHERE, so a video from
    // another school can't be mutated even if its id is guessed.
    const result = await db.video.updateMany({
      where: { id: videoId, schoolId },
      data: {
        approvalStatus: decision,
        approvedBy: decision === "APPROVED" ? session.user.id : null,
        approvedAt: decision === "APPROVED" ? new Date() : null,
        rejectionReason:
          decision === "REJECTED" ? (rejectionReason ?? null) : null,
      },
    })

    if (result.count === 0) {
      return { status: "error", message: "Video not found" }
    }

    // Tell the contributor — same notification shapes as the platform lane
    // (approval-actions.ts). Never fail the review over a notification.
    try {
      await db.notification.create({
        data: {
          schoolId,
          userId: video.userId,
          actorId: session.user.id,
          priority: "normal",
          type: decision === "APPROVED" ? "document_shared" : "system_alert",
          title:
            decision === "APPROVED" ? "Video approved" : "Video needs changes",
          body:
            decision === "APPROVED"
              ? `Your video "${video.title}" has been approved and is now live.`
              : `Your video "${video.title}" was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
          metadata: {
            entityType: "video",
            entityId: video.id,
            url: "/stream/settings?tab=videos",
          },
        },
      })
    } catch (notifyError) {
      console.error("Failed to notify video contributor:", notifyError)
    }

    // Refresh the review queue (settings) and the catalog/lesson views where an
    // approved video now surfaces.
    revalidatePath("/[lang]/s/[subdomain]/stream/settings")
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
