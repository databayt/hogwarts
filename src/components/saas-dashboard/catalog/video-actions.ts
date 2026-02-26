"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3"

import { invalidateCache } from "@/lib/cloudfront"
import { db } from "@/lib/db"

import { lessonVideoSchema } from "./video-validation"

// ============================================================================
// Authorization helper — DEVELOPER only, NO schoolId
// ============================================================================

async function requireDeveloper() {
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
    throw new Error("Unauthorized: DEVELOPER role required")
  }
  return session
}

// ============================================================================
// S3 client (lazy singleton)
// ============================================================================

let s3: S3Client | null = null

function getS3(): S3Client {
  if (!s3) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials not configured")
    }
    s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return s3
}

// ============================================================================
// Helpers
// ============================================================================

function detectProvider(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("vimeo.com")) return "vimeo"
  return "self-hosted"
}

function extractExternalId(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return ytMatch[1]

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return vimeoMatch[1]

  return null
}

// ============================================================================
// CRUD
// ============================================================================

export async function createLessonVideo(input: {
  catalogLessonId: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string | null
  durationSeconds?: number | null
  storageProvider?: string | null
  storageKey?: string | null
}) {
  const session = await requireDeveloper()
  const validated = lessonVideoSchema.parse(input)
  const provider = detectProvider(validated.videoUrl)

  const video = await db.lessonVideo.create({
    data: {
      catalogLessonId: validated.catalogLessonId,
      userId: session.user.id,
      schoolId: null,
      title: validated.title,
      description: validated.description ?? null,
      videoUrl: validated.videoUrl,
      thumbnailUrl: validated.thumbnailUrl ?? null,
      durationSeconds: validated.durationSeconds ?? null,
      provider,
      externalId: extractExternalId(validated.videoUrl),
      storageProvider: validated.storageProvider ?? null,
      storageKey: validated.storageKey ?? null,
      visibility: "PUBLIC",
      approvalStatus: "APPROVED",
      isFeatured: true,
    },
  })

  revalidatePath("/catalog")
  return { success: true, video }
}

export async function getLessonVideos(catalogLessonId: string) {
  await requireDeveloper()

  const videos = await db.lessonVideo.findMany({
    where: { catalogLessonId },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      videoUrl: true,
      provider: true,
      durationSeconds: true,
      isFeatured: true,
      visibility: true,
      approvalStatus: true,
      storageKey: true,
      createdAt: true,
    },
  })

  return videos
}

export async function deleteLessonVideo(videoId: string) {
  await requireDeveloper()

  const video = await db.lessonVideo.findUniqueOrThrow({
    where: { id: videoId },
    select: { storageKey: true, catalogLessonId: true },
  })

  // Delete from S3 if self-hosted
  if (video.storageKey) {
    try {
      const bucket = process.env.AWS_S3_BUCKET
      if (bucket) {
        await getS3().send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: video.storageKey,
          })
        )
        // Invalidate CloudFront cache
        await invalidateCache([video.storageKey])
      }
    } catch {
      // Non-critical: DB record still gets deleted
    }
  }

  await db.lessonVideo.delete({ where: { id: videoId } })

  revalidatePath("/catalog")
  return { success: true }
}

export async function toggleLessonVideoFeatured(videoId: string) {
  await requireDeveloper()

  const video = await db.lessonVideo.findUniqueOrThrow({
    where: { id: videoId },
    select: { isFeatured: true },
  })

  const updated = await db.lessonVideo.update({
    where: { id: videoId },
    data: { isFeatured: !video.isFeatured },
  })

  revalidatePath("/catalog")
  return { success: true, isFeatured: updated.isFeatured }
}
