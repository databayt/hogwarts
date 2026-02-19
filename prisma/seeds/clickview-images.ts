/**
 * ClickView Images Seed
 *
 * Processes ClickView images through Sharp → WebP → S3/CloudFront
 * for US/ClickView catalog subjects.
 *
 * Sources (priority order):
 *   1. Illustration images from public/clickview/illustrations/ (discover page covers)
 *   2. Banner images from public/clickview/banners/ (detail page heroes)
 *   3. imageKey pointing to a local file
 *
 * Usage: pnpm db:seed:single clickview-images
 */

import fs from "fs"
import path from "path"
import type { PrismaClient } from "@prisma/client"

import { processAndUploadCatalogImage } from "../../src/lib/catalog-image"
import { logSuccess } from "./utils"

const ILLUSTRATIONS_DIR = path.resolve(
  __dirname,
  "../../public/clickview/illustrations"
)
const BANNERS_DIR = path.resolve(__dirname, "../../public/clickview/banners")

export async function seedClickViewImages(prisma: PrismaClient): Promise<void> {
  await processThumbnails(prisma)
  await processBanners(prisma)
}

/**
 * Process illustration images → S3 thumbnails (thumbnailKey).
 * Skips subjects that already have a thumbnailKey.
 */
async function processThumbnails(prisma: PrismaClient): Promise<void> {
  const subjects = await prisma.catalogSubject.findMany({
    where: {
      system: "clickview",
      thumbnailKey: null,
    },
    select: { id: true, slug: true, name: true, imageKey: true },
  })

  if (subjects.length === 0) {
    console.log("  All ClickView subjects already have thumbnails")
    return
  }

  console.log(
    `  Found ${subjects.length} ClickView subjects without thumbnails`
  )

  let uploadCount = 0

  for (const subject of subjects) {
    const filePath = findImageFile(subject.slug, subject.imageKey)

    if (!filePath) {
      console.log(`  Skipped ${subject.slug} (no local image found)`)
      continue
    }

    const fileBuffer = fs.readFileSync(filePath)
    const key = `catalog/subjects/${subject.slug}/thumbnail`

    try {
      await processAndUploadCatalogImage(fileBuffer, key)
      await prisma.catalogSubject.update({
        where: { id: subject.id },
        data: { thumbnailKey: key },
      })
      uploadCount++
      console.log(`  Uploaded thumbnail ${subject.slug}`)
    } catch (err) {
      console.error(`  Failed to upload thumbnail ${subject.slug}:`, err)
    }
  }

  logSuccess("ClickView Thumbnails", uploadCount, "S3/CloudFront")
}

/**
 * Process banner images → S3 banners (bannerUrl).
 * Skips subjects that already have a bannerUrl.
 */
async function processBanners(prisma: PrismaClient): Promise<void> {
  const subjects = await prisma.catalogSubject.findMany({
    where: {
      system: "clickview",
      OR: [{ bannerUrl: null }, { bannerUrl: { startsWith: "/" } }],
    },
    select: { id: true, slug: true, name: true },
  })

  if (subjects.length === 0) {
    console.log("  All ClickView subjects already have banners")
    return
  }

  console.log(`  Found ${subjects.length} ClickView subjects without banners`)

  let uploadCount = 0

  for (const subject of subjects) {
    if (!fs.existsSync(BANNERS_DIR)) continue

    const bannerPath = path.join(BANNERS_DIR, `${subject.slug}.jpg`)
    if (!fs.existsSync(bannerPath)) {
      console.log(`  Skipped banner ${subject.slug} (no local file)`)
      continue
    }

    const fileBuffer = fs.readFileSync(bannerPath)
    const key = `catalog/subjects/${subject.slug}/banner`

    try {
      await processAndUploadCatalogImage(fileBuffer, key)
      await prisma.catalogSubject.update({
        where: { id: subject.id },
        data: { bannerUrl: key },
      })
      uploadCount++
      console.log(`  Uploaded banner ${subject.slug}`)
    } catch (err) {
      console.error(`  Failed to upload banner ${subject.slug}:`, err)
    }
  }

  logSuccess("ClickView Banners", uploadCount, "S3/CloudFront")
}

/**
 * Find the best available local image file for a subject.
 * Priority: illustration → banner → imageKey local file
 */
function findImageFile(slug: string, imageKey: string | null): string | null {
  // 1. Check illustration directory (discover page cover images)
  if (fs.existsSync(ILLUSTRATIONS_DIR)) {
    const illustrationPath = path.join(ILLUSTRATIONS_DIR, `${slug}.jpg`)
    if (fs.existsSync(illustrationPath)) {
      return illustrationPath
    }
  }

  // 2. Check banner directory
  if (fs.existsSync(BANNERS_DIR)) {
    const bannerPath = path.join(BANNERS_DIR, `${slug}.jpg`)
    if (fs.existsSync(bannerPath)) {
      return bannerPath
    }
  }

  // 3. Check if imageKey points to a local file
  if (imageKey && imageKey.startsWith("/")) {
    const localPath = path.resolve(__dirname, "../..", `public${imageKey}`)
    if (fs.existsSync(localPath)) {
      return localPath
    }
  }

  return null
}
