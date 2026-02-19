/**
 * ClickView Lesson & Chapter Images Seed
 *
 * Processes all lesson and chapter images through Sharp → WebP → S3/CloudFront
 * to match subject-level image quality with zero external dependencies.
 *
 * Sources: public/clickview/by-url/{subject-slug}/ directories
 * Filename pattern: {topic-slug}-{coverId}.jpg
 *
 * Deduplication: Tracks coverId → thumbnailKey. When multiple records share
 * the same coverId, uploads once and reuses the S3 key.
 *
 * Idempotency: Filters WHERE thumbnailKey IS NULL. Safe to interrupt and resume.
 *
 * Usage: pnpm db:seed:single clickview-lesson-images
 */

import fs from "fs"
import path from "path"
import type { PrismaClient } from "@prisma/client"

import { processAndUploadCatalogImage } from "../../src/lib/catalog-image"
import { logSuccess } from "./utils"

const BY_URL_DIR = path.resolve(__dirname, "../../public/clickview/by-url")

// ============================================================================
// Build coverId → local file path map
// ============================================================================

/**
 * Scan all by-url directories and build a map of coverId → absolute file path.
 * Filename pattern: {slug}-{coverId}.jpg
 */
function buildCoverIdMap(): Map<string, string> {
  const map = new Map<string, string>()

  if (!fs.existsSync(BY_URL_DIR)) {
    console.log("  by-url directory not found, skipping")
    return map
  }

  const dirs = fs.readdirSync(BY_URL_DIR, { withFileTypes: true })
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue
    const dirPath = path.join(BY_URL_DIR, dir.name)
    const files = fs.readdirSync(dirPath)

    for (const file of files) {
      if (!file.endsWith(".jpg")) continue
      // Extract coverId from filename: {slug}-{coverId}.jpg
      const match = file.match(/-([A-Za-z0-9]+)\.jpg$/)
      if (match) {
        map.set(match[1], path.join(dirPath, file))
      }
    }
  }

  return map
}

// ============================================================================
// Main seed function
// ============================================================================

export async function seedClickViewLessonImages(
  prisma: PrismaClient
): Promise<void> {
  const coverIdMap = buildCoverIdMap()
  console.log(`  Found ${coverIdMap.size} local cover images`)

  if (coverIdMap.size === 0) return

  // Deduplication: coverId → S3 thumbnailKey (uploaded once, reused)
  const uploaded = new Map<string, string>()

  await processLessons(prisma, coverIdMap, uploaded)
  await processChapters(prisma, coverIdMap, uploaded)
}

// ============================================================================
// Process lessons
// ============================================================================

async function processLessons(
  prisma: PrismaClient,
  coverIdMap: Map<string, string>,
  uploaded: Map<string, string>
): Promise<void> {
  // Fetch lessons without thumbnailKey, joined with chapter+subject for slug paths
  const lessons = await prisma.catalogLesson.findMany({
    where: {
      thumbnailKey: null,
      chapter: {
        subject: { system: "clickview" },
      },
    },
    select: {
      id: true,
      slug: true,
      imageKey: true,
      clickviewCoverId: true,
      chapter: {
        select: {
          slug: true,
          subject: {
            select: { slug: true },
          },
        },
      },
    },
  })

  if (lessons.length === 0) {
    console.log("  All ClickView lessons already have thumbnails")
    return
  }

  console.log(`  Processing ${lessons.length} lessons without thumbnails...`)

  let uploadCount = 0
  let reuseCount = 0
  let skipCount = 0

  for (const lesson of lessons) {
    // Extract coverId from imageKey URL or clickviewCoverId field
    const coverId =
      lesson.clickviewCoverId ?? extractCoverIdFromUrl(lesson.imageKey)

    if (!coverId) {
      skipCount++
      continue
    }

    const subjectSlug = lesson.chapter.subject.slug
    const s3Key = `catalog/subjects/${subjectSlug}/lessons/${lesson.slug}/thumbnail`

    // Check if already uploaded (dedup)
    if (uploaded.has(coverId)) {
      const existingKey = uploaded.get(coverId)!
      await prisma.catalogLesson.update({
        where: { id: lesson.id },
        data: { thumbnailKey: existingKey },
      })
      reuseCount++
      continue
    }

    // Find local file
    const filePath = coverIdMap.get(coverId)
    if (!filePath) {
      skipCount++
      continue
    }

    try {
      const fileBuffer = fs.readFileSync(filePath)
      await processAndUploadCatalogImage(fileBuffer, s3Key)
      await prisma.catalogLesson.update({
        where: { id: lesson.id },
        data: { thumbnailKey: s3Key },
      })
      uploaded.set(coverId, s3Key)
      uploadCount++

      if (uploadCount % 50 === 0) {
        console.log(
          `  Lessons: ${uploadCount} uploaded, ${reuseCount} reused, ${skipCount} skipped`
        )
      }
    } catch (err) {
      console.error(`  Failed lesson ${lesson.slug}:`, err)
    }
  }

  logSuccess(
    "ClickView Lesson Thumbnails",
    uploadCount,
    `${reuseCount} reused, ${skipCount} skipped`
  )
}

// ============================================================================
// Process chapters
// ============================================================================

async function processChapters(
  prisma: PrismaClient,
  coverIdMap: Map<string, string>,
  uploaded: Map<string, string>
): Promise<void> {
  // Fetch chapters without thumbnailKey, with their first lesson's coverId
  const chapters = await prisma.catalogChapter.findMany({
    where: {
      thumbnailKey: null,
      subject: { system: "clickview" },
    },
    select: {
      id: true,
      slug: true,
      imageKey: true,
      subject: {
        select: { slug: true },
      },
      lessons: {
        select: { clickviewCoverId: true, imageKey: true },
        orderBy: { sequenceOrder: "asc" },
        take: 1,
      },
    },
  })

  if (chapters.length === 0) {
    console.log("  All ClickView chapters already have thumbnails")
    return
  }

  console.log(`  Processing ${chapters.length} chapters without thumbnails...`)

  let uploadCount = 0
  let reuseCount = 0
  let skipCount = 0

  for (const chapter of chapters) {
    // Use first child lesson's coverId (matches ClickView behavior)
    const firstLesson = chapter.lessons[0]
    const coverId = firstLesson
      ? (firstLesson.clickviewCoverId ??
        extractCoverIdFromUrl(firstLesson.imageKey))
      : extractCoverIdFromUrl(chapter.imageKey)

    if (!coverId) {
      skipCount++
      continue
    }

    const subjectSlug = chapter.subject.slug
    const s3Key = `catalog/subjects/${subjectSlug}/chapters/${chapter.slug}/thumbnail`

    // Check if already uploaded (dedup from lesson phase)
    if (uploaded.has(coverId)) {
      const existingKey = uploaded.get(coverId)!
      await prisma.catalogChapter.update({
        where: { id: chapter.id },
        data: { thumbnailKey: existingKey },
      })
      reuseCount++
      continue
    }

    // Find local file
    const filePath = coverIdMap.get(coverId)
    if (!filePath) {
      skipCount++
      continue
    }

    try {
      const fileBuffer = fs.readFileSync(filePath)
      await processAndUploadCatalogImage(fileBuffer, s3Key)
      await prisma.catalogChapter.update({
        where: { id: chapter.id },
        data: { thumbnailKey: s3Key },
      })
      uploaded.set(coverId, s3Key)
      uploadCount++
    } catch (err) {
      console.error(`  Failed chapter ${chapter.slug}:`, err)
    }
  }

  logSuccess(
    "ClickView Chapter Thumbnails",
    uploadCount,
    `${reuseCount} reused, ${skipCount} skipped`
  )
}

// ============================================================================
// Helpers
// ============================================================================

function extractCoverIdFromUrl(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/\/covers\/([^?/]+)/)
  return match ? match[1] : null
}
