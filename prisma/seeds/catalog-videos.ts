/**
 * Catalog Videos Seed
 *
 * Creates LessonVideo records for catalog lessons.
 * Supports two modes:
 *   - URL-only: Videos already in S3, just create DB records
 *   - Upload:   Read from local dir, upload to S3, then create records
 *
 * Usage:
 *   pnpm db:seed:single catalog-videos
 */

import { PrismaClient } from "@prisma/client"

// Map lesson slugs to video metadata.
// Add entries here as videos are uploaded to S3.
const VIDEO_MAP: Record<
  string,
  { s3Key: string; title: string; durationSeconds?: number }
> = {
  // Example entries — uncomment and fill in as videos are added:
  // "introduction-to-algebra": {
  //   s3Key: "stream/platform/video/algebra-intro.mp4",
  //   title: "Introduction to Algebra",
  //   durationSeconds: 720,
  // },
}

export async function seedCatalogVideos(prisma: PrismaClient): Promise<void> {
  const slugs = Object.keys(VIDEO_MAP)

  if (slugs.length === 0) {
    console.log("  No video entries in VIDEO_MAP — skipping")
    return
  }

  // Find the dev user
  const devUser = await prisma.user.findFirst({
    where: { email: "dev@databayt.org" },
    select: { id: true },
  })

  if (!devUser) {
    throw new Error(
      "Dev user (dev@databayt.org) not found. Run auth seed first."
    )
  }

  // Find lessons by slug
  const lessons = await prisma.catalogLesson.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  })

  const lessonBySlug = new Map(lessons.map((l) => [l.slug, l]))

  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN
  let created = 0
  let skipped = 0

  for (const [slug, meta] of Object.entries(VIDEO_MAP)) {
    const lesson = lessonBySlug.get(slug)
    if (!lesson) {
      console.log(`  Lesson "${slug}" not found — skipping`)
      skipped++
      continue
    }

    // Build video URL
    const videoUrl = cloudfrontDomain
      ? `https://${cloudfrontDomain}/${meta.s3Key}`
      : meta.s3Key

    // Upsert to avoid duplicates on re-run
    await prisma.lessonVideo.upsert({
      where: {
        id: `seed-video-${slug}`,
      },
      create: {
        id: `seed-video-${slug}`,
        catalogLessonId: lesson.id,
        userId: devUser.id,
        schoolId: null,
        title: meta.title,
        videoUrl,
        provider: "self-hosted",
        storageProvider: "aws_s3",
        storageKey: meta.s3Key,
        durationSeconds: meta.durationSeconds ?? null,
        visibility: "PUBLIC",
        approvalStatus: "APPROVED",
        isFeatured: true,
      },
      update: {
        title: meta.title,
        videoUrl,
        durationSeconds: meta.durationSeconds ?? null,
      },
    })
    created++
  }

  console.log(`  Videos: ${created} created/updated, ${skipped} skipped`)
}
