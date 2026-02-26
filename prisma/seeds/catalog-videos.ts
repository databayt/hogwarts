// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog Videos Seed
 *
 * Dynamically creates 2 LessonVideo records per catalog subject
 * (one for each of the first 2 lessons). Reuses S3 video files
 * uploaded under the old level-based slug format.
 *
 * Slug mapping: us-math-grade-3 -> elementary-math (S3 key)
 *
 * Usage:
 *   pnpm db:seed:single catalog-videos
 */

import { PrismaClient } from "@prisma/client"

/**
 * Derive the old level-based slug from a grade-specific slug.
 * us-{base}-grade-{N} -> {level}-{base}
 */
function deriveOldSlug(slug: string): string | null {
  const match = slug.match(/^us-(.+)-grade-(\d+)$/)
  if (!match) return null

  const base = match[1]
  const gradeNum = parseInt(match[2])

  const level = gradeNum <= 6 ? "elementary" : gradeNum <= 9 ? "middle" : "high"

  return `${level}-${base}`
}

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
  const subjects = await prisma.catalogSubject.findMany({
    where: { status: "PUBLISHED", system: "clickview" },
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

    const oldSlug = deriveOldSlug(subject.slug)
    if (!oldSlug) {
      skipped++
      continue
    }

    for (let i = 0; i < first2.length; i++) {
      const lesson = first2[i]
      const s3Key = `stream/platform/video/sample-${oldSlug}-${i + 1}.mp4`
      const videoUrl = `https://${cloudfrontDomain}/${s3Key}`
      const seedId = `seed-vid-${lesson.id}`

      await prisma.lessonVideo.upsert({
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
