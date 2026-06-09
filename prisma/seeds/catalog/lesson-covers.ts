// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * US Lesson & Chapter Cover Images Seed
 *
 * Reads each cover SOURCE from our own S3 (`catalog/source-covers/{coverId}`,
 * populated once by scripts/snapshot-covers.ts), runs it through Sharp → WebP →
 * per-lesson/chapter thumbnails on S3/CloudFront. No external CDN dependency: a
 * lesson with no owned source simply keeps its shared concept thumbnail.
 *
 * Dedup: a coverId shared by many records uploads once and reuses the S3 key.
 * Idempotency: filters WHERE thumbnail IS NULL. Safe to interrupt and resume.
 *
 * Usage: pnpm db:seed:single lesson-covers
 */

import type { PrismaClient } from "@prisma/client"

import {
  getRawObject,
  processAndUploadCatalogImage,
} from "../../../src/components/catalog/image"
import { logSuccess } from "../utils"

// Where the owned cover sources live (see scripts/snapshot-covers.ts).
const SOURCE_PREFIX = "catalog/source-covers"

/** Read an owned cover source from our S3. Returns null if we don't own it. */
function readCoverSource(coverId: string): Promise<Buffer | null> {
  return getRawObject(`${SOURCE_PREFIX}/${coverId}`)
}

export async function seedLessonCovers(prisma: PrismaClient): Promise<void> {
  // Dedup: coverId → S3 thumbnail key (uploaded once, reused).
  const uploaded = new Map<string, string>()
  await processLessons(prisma, uploaded)
  await processChapters(prisma, uploaded)
}

async function processLessons(
  prisma: PrismaClient,
  uploaded: Map<string, string>
): Promise<void> {
  const lessons = await prisma.lesson.findMany({
    where: { thumbnail: null, chapter: { subject: { curriculum: "US" } } },
    select: {
      id: true,
      slug: true,
      clickviewCoverId: true,
      chapter: { select: { subject: { select: { slug: true } } } },
    },
  })

  if (lessons.length === 0) {
    console.log("  All US lessons already have thumbnails")
    return
  }
  console.log(`  Processing ${lessons.length} lessons without thumbnails...`)

  let uploadedCount = 0
  let reuseCount = 0
  let skipCount = 0

  for (const lesson of lessons) {
    const coverId = lesson.clickviewCoverId ?? null
    if (!coverId) {
      skipCount++
      continue
    }

    const s3Key = `catalog/subjects/${lesson.chapter.subject.slug}/lessons/${lesson.slug}/thumbnail`

    if (uploaded.has(coverId)) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { thumbnail: uploaded.get(coverId)! },
      })
      reuseCount++
      continue
    }

    const source = await readCoverSource(coverId)
    if (!source) {
      skipCount++
      continue
    }

    try {
      await processAndUploadCatalogImage(source, s3Key)
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { thumbnail: s3Key },
      })
      uploaded.set(coverId, s3Key)
      uploadedCount++
    } catch (err) {
      console.error(`  Failed lesson ${lesson.slug}:`, err)
    }
  }

  logSuccess(
    "US Lesson Thumbnails",
    uploadedCount,
    `${uploadedCount} uploaded, ${reuseCount} reused, ${skipCount} skipped (no owned source)`
  )
}

async function processChapters(
  prisma: PrismaClient,
  uploaded: Map<string, string>
): Promise<void> {
  const chapters = await prisma.chapter.findMany({
    where: { thumbnail: null, subject: { curriculum: "US" } },
    select: {
      id: true,
      slug: true,
      subject: { select: { slug: true } },
      lessons: {
        select: { clickviewCoverId: true },
        orderBy: { sequenceOrder: "asc" },
        take: 1,
      },
    },
  })

  if (chapters.length === 0) {
    console.log("  All US chapters already have thumbnails")
    return
  }
  console.log(`  Processing ${chapters.length} chapters without thumbnails...`)

  let uploadedCount = 0
  let reuseCount = 0
  let skipCount = 0

  for (const chapter of chapters) {
    const coverId = chapter.lessons[0]?.clickviewCoverId ?? null
    if (!coverId) {
      skipCount++
      continue
    }

    const s3Key = `catalog/subjects/${chapter.subject.slug}/chapters/${chapter.slug}/thumbnail`

    if (uploaded.has(coverId)) {
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { thumbnail: uploaded.get(coverId)! },
      })
      reuseCount++
      continue
    }

    const source = await readCoverSource(coverId)
    if (!source) {
      skipCount++
      continue
    }

    try {
      await processAndUploadCatalogImage(source, s3Key)
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { thumbnail: s3Key },
      })
      uploaded.set(coverId, s3Key)
      uploadedCount++
    } catch (err) {
      console.error(`  Failed chapter ${chapter.slug}:`, err)
    }
  }

  logSuccess(
    "US Chapter Thumbnails",
    uploadedCount,
    `${uploadedCount} uploaded, ${reuseCount} reused, ${skipCount} skipped (no owned source)`
  )
}
