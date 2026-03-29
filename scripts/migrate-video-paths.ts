// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Migrate Video S3 Paths
 *
 * Moves videos from flat structure:
 *   stream/platform/video/sample-{subject-slug}-{n}.mp4
 *
 * To lesson-based structure:
 *   catalog/lessons/{lesson-slug}/video/{video-id}.mp4
 *
 * Steps:
 *   1. Fetch all self-hosted platform videos with their lesson slugs
 *   2. S3-copy each file from old path to new path
 *   3. Update DB records (videoUrl + storageKey)
 *   4. Optionally delete old S3 objects (--cleanup flag)
 *
 * Usage:
 *   npx tsx scripts/migrate-video-paths.ts              # Copy + update DB
 *   npx tsx scripts/migrate-video-paths.ts --dry-run    # Preview only
 *   npx tsx scripts/migrate-video-paths.ts --cleanup    # Also delete old S3 objects
 */

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { PrismaClient } from "@prisma/client"

const DRY_RUN = process.argv.includes("--dry-run")
const CLEANUP = process.argv.includes("--cleanup")

const S3_VIDEO_BASE = "catalog/lessons"

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET
const AWS_REGION = process.env.AWS_REGION || "us-east-1"
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN

function getS3(): S3Client {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials not configured")
  }
  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  })
}

function getCloudFrontUrl(s3Key: string): string {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`
  }
  return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`
}

async function s3Exists(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: AWS_S3_BUCKET!, Key: key }))
    return true
  } catch {
    return false
  }
}

const BATCH_SIZE = 50

async function main() {
  console.log("🎬 Migrate Video S3 Paths")
  console.log("=".repeat(50))
  if (DRY_RUN) console.log("  (DRY RUN — no changes)")
  if (CLEANUP) console.log("  (CLEANUP — will delete old S3 objects)")
  console.log()

  const prisma = new PrismaClient()
  const s3 = DRY_RUN ? null : getS3()

  // Keep Neon awake during long S3 operations
  const keepAlive = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      // Reconnect on next real query
    }
  }, 30_000)

  try {
    // Fetch all self-hosted platform videos (schoolId = null) with lesson slug
    const videos = await prisma.video.findMany({
      where: {
        provider: "self-hosted",
        schoolId: null,
        storageKey: { startsWith: "stream/platform/video/" },
      },
      select: {
        id: true,
        videoUrl: true,
        storageKey: true,
        lesson: {
          select: { slug: true },
        },
      },
    })

    console.log(`Found ${videos.length} videos to migrate\n`)

    if (videos.length === 0) {
      console.log("Nothing to do.")
      return
    }

    let copied = 0
    let skipped = 0
    let updated = 0
    let deleted = 0
    let errors = 0

    // Process in batches
    for (let b = 0; b < videos.length; b += BATCH_SIZE) {
      const batch = videos.slice(b, b + BATCH_SIZE)
      const batchNum = Math.floor(b / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(videos.length / BATCH_SIZE)

      console.log(
        `  Batch ${batchNum}/${totalBatches} (${b + 1}-${Math.min(b + BATCH_SIZE, videos.length)}/${videos.length})`
      )

      // S3 copies in parallel within batch
      const results = await Promise.allSettled(
        batch.map(async (video) => {
          const oldKey = video.storageKey
          if (!oldKey) return { status: "skip" as const, id: video.id }

          const newKey = `${S3_VIDEO_BASE}/${video.lesson.slug}/video/${video.id}.mp4`
          const newUrl = getCloudFrontUrl(newKey)

          if (DRY_RUN) {
            return {
              status: "copy" as const,
              id: video.id,
              oldKey,
              newKey,
              newUrl,
            }
          }

          // S3 copy (skip if already exists at new path)
          let didCopy = false
          if (s3 && !(await s3Exists(s3, newKey))) {
            if (!(await s3Exists(s3, oldKey))) {
              return {
                status: "skip" as const,
                id: video.id,
                reason: "missing",
              }
            }
            await s3.send(
              new CopyObjectCommand({
                Bucket: AWS_S3_BUCKET!,
                CopySource: `${AWS_S3_BUCKET}/${oldKey}`,
                Key: newKey,
                ContentType: "video/mp4",
                CacheControl: "public, max-age=31536000, immutable",
                MetadataDirective: "REPLACE",
              })
            )
            didCopy = true
          }

          return {
            status: didCopy ? ("copy" as const) : ("skip" as const),
            id: video.id,
            oldKey,
            newKey,
            newUrl,
          }
        })
      )

      // Batch DB updates
      const dbUpdates: { id: string; newUrl: string; newKey: string }[] = []

      for (const result of results) {
        if (result.status === "rejected") {
          errors++
          console.error(`    ❌ ${result.reason}`)
          continue
        }
        const v = result.value
        if (v.status === "skip") {
          skipped++
          continue
        }
        if (v.status === "copy") {
          copied++
          if (v.newUrl && v.newKey) {
            dbUpdates.push({ id: v.id, newUrl: v.newUrl, newKey: v.newKey })
          }
        }
      }

      if (!DRY_RUN && dbUpdates.length > 0) {
        await Promise.all(
          dbUpdates.map((u) =>
            prisma.video.update({
              where: { id: u.id },
              data: { videoUrl: u.newUrl, storageKey: u.newKey },
            })
          )
        )
        updated += dbUpdates.length
      }

      // Cleanup old S3 objects
      if (CLEANUP && s3 && !DRY_RUN) {
        for (const result of results) {
          if (result.status === "fulfilled" && result.value.oldKey) {
            try {
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: AWS_S3_BUCKET!,
                  Key: result.value.oldKey,
                })
              )
              deleted++
            } catch {
              // Non-critical
            }
          }
        }
      }
    }

    console.log("\n" + "=".repeat(50))
    console.log("📊 Migration Summary:")
    console.log(`   S3 copied:  ${copied}`)
    console.log(`   S3 skipped: ${skipped} (already exists or missing source)`)
    console.log(`   DB updated: ${updated}`)
    if (CLEANUP) console.log(`   Old deleted: ${deleted}`)
    if (errors) console.log(`   Errors:     ${errors}`)
    console.log(
      `\nNew path convention: ${S3_VIDEO_BASE}/{lesson-slug}/video/{video-id}.mp4`
    )
  } finally {
    clearInterval(keepAlive)
    await prisma.$disconnect()
  }
}

main().catch(console.error)
