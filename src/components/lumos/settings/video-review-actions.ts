"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  buildProtectedVideoUrl,
  isExternallyHostedVideo,
} from "@/components/lumos/video/media-access"

export interface SubmittedVideoItem {
  id: string
  title: string
  description: string | null
  videoUrl: string
  provider: string
  durationSeconds: number | null
  visibility: string
  approvalStatus: string
  rejectionReason: string | null
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
 * Every video this school has submitted, newest first — a STATUS FEED, not a
 * work queue. The platform is the sole approver now, so the school's job here
 * is to see where each submission stands and read back any rejection feedback;
 * filtering to PENDING would hide exactly the rows carrying that feedback.
 */
export async function getSubmittedVideos(): Promise<SubmittedVideoItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  if (!["ADMIN", "DEVELOPER"].includes(session.user.role || "")) return []

  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const videos = await db.video.findMany({
    where: {
      schoolId,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      videoUrl: true,
      provider: true,
      durationSeconds: true,
      visibility: true,
      approvalStatus: true,
      rejectionReason: true,
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

  // Readers open these links in a new tab. Self-hosted ones resolve through
  // the authorizing route rather than the raw storage URL, which is a
  // permanent, unauthenticated link to the object for anyone it is forwarded
  // to — the role gate covers who sees the page, not who can use the URL after.
  return videos.map((v) => ({
    ...v,
    videoUrl: isExternallyHostedVideo(v.videoUrl)
      ? v.videoUrl
      : buildProtectedVideoUrl(v.id),
  }))
}
