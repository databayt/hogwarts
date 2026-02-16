/**
 * ClickView Images Seed
 *
 * Processes ClickView banner images through Sharp → WebP → S3/CloudFront
 * for US/ClickView catalog subjects.
 *
 * Usage: pnpm db:seed:single clickview-images
 */

import fs from "fs"
import path from "path"
import type { PrismaClient } from "@prisma/client"

import { processAndUploadCatalogImage } from "../../src/lib/catalog-image"
import { logSuccess } from "./utils"

const BANNERS_DIR = path.resolve(__dirname, "../../public/clickview/banners")

export async function seedClickViewImages(prisma: PrismaClient): Promise<void> {
  // Get all ClickView subjects that don't have thumbnails yet
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

  // Try to find banner images
  let uploadCount = 0

  for (const subject of subjects) {
    // Try level-specific banner: match slug pattern like "elementary-arts"
    const level = subject.slug.split("-")[0] // elementary, middle, high
    const nameSlug = subject.slug.replace(`${level}-`, "")

    // Try various filename patterns
    const candidates = [
      `${subject.slug}.jpg`,
      `${level}-${nameSlug}.jpg`,
      `us-${subject.slug}.jpg`,
    ]

    let filePath: string | null = null

    // Also check if imageKey points to a local file
    if (
      subject.imageKey &&
      fs.existsSync(path.resolve(__dirname, "../..", subject.imageKey))
    ) {
      filePath = path.resolve(__dirname, "../..", subject.imageKey)
    }

    // Check banner directory
    if (!filePath && fs.existsSync(BANNERS_DIR)) {
      for (const candidate of candidates) {
        const candidatePath = path.join(BANNERS_DIR, candidate)
        if (fs.existsSync(candidatePath)) {
          filePath = candidatePath
          break
        }
      }
    }

    if (!filePath) {
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
      console.log(`  Uploaded ${subject.slug}`)
    } catch (err) {
      console.error(`  Failed to upload ${subject.slug}:`, err)
    }
  }

  logSuccess("ClickView Images", uploadCount, "S3/CloudFront")
}
