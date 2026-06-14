"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface TeacherStats {
  totalVideos: number
  pendingVideos: number
  approvedVideos: number
  totalViews: number
}

export async function getTeacherStats(): Promise<TeacherStats> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user || !schoolId) {
    return {
      totalVideos: 0,
      pendingVideos: 0,
      approvedVideos: 0,
      totalViews: 0,
    }
  }

  // One groupBy over approvalStatus replaces three separate count() queries;
  // the view-sum stays as a parallel aggregate. (2 queries instead of 4.)
  const [groups, viewsResult] = await Promise.all([
    db.video.groupBy({
      by: ["approvalStatus"],
      where: { userId: session.user.id, schoolId },
      _count: true,
    }),
    db.video.aggregate({
      where: { userId: session.user.id, schoolId },
      _sum: { viewCount: true },
    }),
  ])

  const countByStatus = new Map(groups.map((g) => [g.approvalStatus, g._count]))

  return {
    totalVideos: groups.reduce((sum, g) => sum + g._count, 0),
    pendingVideos: countByStatus.get("PENDING") ?? 0,
    approvedVideos: countByStatus.get("APPROVED") ?? 0,
    totalViews: viewsResult._sum.viewCount ?? 0,
  }
}

export interface TeacherVideo {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl: string | null
  approvalStatus: string
  visibility: string
  viewCount: number
  isFeatured: boolean
  price: number | null
  currency: string | null
  rejectionReason: string | null
  createdAt: Date
  lesson: {
    id: string
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

export async function getMyVideos(): Promise<TeacherVideo[]> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user || !schoolId) {
    return []
  }

  const videos = await db.video.findMany({
    where: {
      userId: session.user.id,
      schoolId,
    },
    select: {
      id: true,
      title: true,
      videoUrl: true,
      thumbnailUrl: true,
      approvalStatus: true,
      visibility: true,
      viewCount: true,
      isFeatured: true,
      price: true,
      currency: true,
      rejectionReason: true,
      createdAt: true,
      lesson: {
        select: {
          id: true,
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
    orderBy: { createdAt: "desc" },
  })

  return videos
}
