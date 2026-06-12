// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog Videos Seed
 *
 * Creates Video records for catalog lessons — but ONLY for lessons whose
 * mp4 actually exists on the CDN (HEAD probe). Rows pointing at missing
 * objects produce broken players, so candidates that fail the probe are
 * skipped and previously seeded rows whose object disappeared are removed.
 *
 * Upload real assets first (scripts/seed-s3-videos.ts), then run this.
 * S3 path convention: catalog/lessons/{lesson-slug}/video/{video-id}.mp4
 *
 * Usage:
 *   pnpm db:seed:single videos
 */

import { PrismaClient } from "@prisma/client"

/** S3 path convention for lesson videos */
const S3_VIDEO_BASE = "catalog/lessons"

const PROBE_CONCURRENCY = 8

/** HEAD-probe a CDN object, with one retry on network failure. */
async function objectExists(url: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { method: "HEAD" })
      return res.ok
    } catch {
      if (attempt === 2) return false
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  return false
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

  // Query all published catalog subjects with their first 2 chapters' lessons.
  // Previously scoped to `curriculum: "us-k12"` only — that left SD-curriculum
  // lessons without playable videos, so click-through from a Grade-10 SD course
  // went to an empty player. Now seeds videos across all published curricula.
  const subjects = await prisma.subject.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      lang: true,
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

  // Build the candidate list, then verify each mp4 exists before writing
  // a row for it.
  interface Candidate {
    seedId: string
    s3Key: string
    videoUrl: string
    lessonId: string
    lessonName: string
    lang: string
    isFeatured: boolean
  }

  const candidates: Candidate[] = []
  let subjectsWithLessons = 0

  for (const subject of subjects) {
    // Flatten lessons from first 2 chapters, take first 2
    const allLessons = subject.chapters.flatMap((ch) => ch.lessons)
    const first2 = allLessons.slice(0, 2)
    if (first2.length === 0) continue
    subjectsWithLessons++

    first2.forEach((lesson, i) => {
      const seedId = `seed-vid-${lesson.id}`
      const s3Key = `${S3_VIDEO_BASE}/${lesson.slug}/video/${seedId}.mp4`
      candidates.push({
        seedId,
        s3Key,
        videoUrl: `https://${cloudfrontDomain}/${s3Key}`,
        lessonId: lesson.id,
        lessonName: lesson.name,
        lang: subject.lang || "en",
        isFeatured: i === 0,
      })
    })
  }

  // Probe the CDN in small batches
  const verified: Candidate[] = []
  for (let i = 0; i < candidates.length; i += PROBE_CONCURRENCY) {
    const batch = candidates.slice(i, i + PROBE_CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (c) => ((await objectExists(c.videoUrl)) ? c : null))
    )
    for (const c of results) if (c) verified.push(c)
  }

  let created = 0
  for (const c of verified) {
    await prisma.video.upsert({
      where: { id: c.seedId },
      create: {
        id: c.seedId,
        catalogLessonId: c.lessonId,
        userId: devUser.id,
        schoolId: null,
        title: `${c.lessonName} - Video`,
        description: `Educational video for ${c.lessonName}`,
        lang: c.lang,
        videoUrl: c.videoUrl,
        provider: "self-hosted",
        storageProvider: "aws_s3",
        storageKey: c.s3Key,
        visibility: "PUBLIC",
        approvalStatus: "APPROVED",
        isFeatured: c.isFeatured,
      },
      update: {
        title: `${c.lessonName} - Video`,
        videoUrl: c.videoUrl,
        storageKey: c.s3Key,
      },
    })
    created++
  }

  // Self-heal: drop previously seeded rows whose backing object is gone
  // (seed rows are PUBLIC, never purchased, so deletion is safe). When the
  // probe verified NOTHING the CDN itself is likely unreachable — keep the
  // existing rows rather than mass-deleting on a network blip.
  let removed = 0
  if (verified.length > 0) {
    const verifiedIds = new Set(verified.map((c) => c.seedId))
    const staleCandidateIds = candidates
      .map((c) => c.seedId)
      .filter((id) => !verifiedIds.has(id))
    const result = await prisma.video.deleteMany({
      where: {
        id: { in: staleCandidateIds, startsWith: "seed-vid-" },
        visibility: "PUBLIC",
      },
    })
    removed = result.count
  } else if (candidates.length > 0) {
    console.log(
      "  No mp4 verified — CDN unreachable or no assets uploaded; leaving existing rows untouched"
    )
  }

  console.log(
    `  Videos: ${created} created/updated (${candidates.length - verified.length} candidates missing mp4, ${removed} stale rows removed) across ${subjectsWithLessons} subjects`
  )
}
