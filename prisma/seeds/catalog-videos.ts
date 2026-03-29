// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog Videos Seed
 *
 * Creates Video records for catalog lessons.
 * S3 path convention: catalog/lessons/{lesson-slug}/video/{video-id}.mp4
 *
 * Usage:
 *   pnpm db:seed:single catalog-videos
 */

import { PrismaClient } from "@prisma/client"

/** S3 path convention for lesson videos */
const S3_VIDEO_BASE = "catalog/lessons"

export async function seedCatalogVideos(prisma: PrismaClient): Promise<void> {
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN
  if (!cloudfrontDomain) {
    console.log("  CLOUDFRONT_DOMAIN not set -- skipping catalog videos")
    return
  }

  const devUser = await prisma.user.findFirst({
    where: { email: "dev@databayt.org" },
    select: { id: true },
  })
  if (!devUser) {
    throw new Error(
      "Dev user (dev@databayt.org) not found. Run auth seed first."
    )
  }

  // Query all published ClickView subjects with their first 2 chapters' lessons
  const subjects = await prisma.subject.findMany({
    where: { status: "PUBLISHED", curriculum: "us-k12" },
    select: {
      id: true,
      slug: true,
      name: true,
      grades: true,
      levels: true,
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: { sequenceOrder: "asc" },
        take: 2,
        select: {
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sequenceOrder: "asc" },
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  })

  let created = 0
  let skipped = 0

  for (const subject of subjects) {
    // Flatten lessons from first 2 chapters, take first 2
    const allLessons = subject.chapters.flatMap((ch) => ch.lessons)
    const first2 = allLessons.slice(0, 2)

    if (first2.length === 0) {
      skipped++
      continue
    }

    for (let i = 0; i < first2.length; i++) {
      const lesson = first2[i]
      const seedId = `seed-vid-${lesson.id}`
      const s3Key = `${S3_VIDEO_BASE}/${lesson.slug}/video/${seedId}.mp4`
      const videoUrl = `https://${cloudfrontDomain}/${s3Key}`

      await prisma.video.upsert({
        where: { id: seedId },
        create: {
          id: seedId,
          catalogLessonId: lesson.id,
          userId: devUser.id,
          schoolId: null,
          title: `${lesson.name} - Video`,
          description: `Educational video for ${lesson.name}`,
          lang: "en",
          videoUrl,
          provider: "self-hosted",
          storageProvider: "aws_s3",
          storageKey: s3Key,
          visibility: "PUBLIC",
          approvalStatus: "APPROVED",
          isFeatured: i === 0,
        },
        update: {
          title: `${lesson.name} - Video`,
          videoUrl,
          storageKey: s3Key,
        },
      })
      created++
    }
  }

  console.log(
    `  Videos: ${created} created/updated for ${subjects.length - skipped} subjects (${skipped} skipped)`
  )
}
