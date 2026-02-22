"use server"

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

  const [totalVideos, pendingVideos, approvedVideos, viewsResult] =
    await Promise.all([
      db.lessonVideo.count({
        where: { userId: session.user.id, schoolId },
      }),
      db.lessonVideo.count({
        where: {
          userId: session.user.id,
          schoolId,
          approvalStatus: "PENDING",
        },
      }),
      db.lessonVideo.count({
        where: {
          userId: session.user.id,
          schoolId,
          approvalStatus: "APPROVED",
        },
      }),
      db.lessonVideo.aggregate({
        where: { userId: session.user.id, schoolId },
        _sum: { viewCount: true },
      }),
    ])

  return {
    totalVideos,
    pendingVideos,
    approvedVideos,
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

  const videos = await db.lessonVideo.findMany({
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
