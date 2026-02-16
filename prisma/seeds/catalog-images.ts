/**
 * Catalog Images Seed
 *
 * Uploads ClickView images to S3/CloudFront for each CatalogSubject.
 * Uses the existing processAndUploadCatalogImage pipeline (Sharp → WebP → S3).
 *
 * Two-phase upload:
 *   1. Curated banners from public/clickview/banners/ (high-quality, hand-picked)
 *   2. Fallback topic images from public/clickview/by-url/ (auto-scraped)
 *
 * Usage: pnpm db:seed:single catalog-images
 */

import fs from "fs"
import path from "path"
import type { PrismaClient } from "@prisma/client"

import { processAndUploadCatalogImage } from "../../src/lib/catalog-image"
import { logSuccess } from "./utils"

// Subject slug → curated banner filename in public/clickview/banners/
// Mirrors BANNER_MAP in catalog.ts (imageKey paths) but here we upload to S3
const BANNER_MAP: Record<string, string> = {
  arabic: "elementary-english-language-arts.jpg",
  english: "high-english-language-arts.jpg",
  french: "high-languages.jpg",
  mathematics: "elementary-math.jpg",
  science: "elementary-science.jpg",
  physics: "high-physics.jpg",
  chemistry: "high-chemistry.jpg",
  biology: "high-life-science.jpg",
  "earth-space-sciences": "high-earth-and-space-science.jpg",
  "computer-science": "high-computer-science-and-technology.jpg",
  "science-engineering": "high-science-and-engineering-practices.jpg",
  history: "high-history.jpg",
  "sudan-history": "high-history.jpg",
  "world-history": "high-history.jpg",
  geography: "high-geography.jpg",
  "social-studies": "high-civics-and-government.jpg",
  "civics-citizenship": "high-civics-and-government.jpg",
  "business-economics": "high-business-and-economics.jpg",
  psychology: "high-health.jpg",
  "islamic-education": "high-religion.jpg",
  quran: "high-religion.jpg",
  ict: "high-computer-science-and-technology.jpg",
  "the-arts": "elementary-arts.jpg",
  music: "high-arts.jpg",
  "physical-education": "high-physical-education.jpg",
  health: "high-health.jpg",
  "life-skills": "high-career-and-technical-education.jpg",
  "career-education": "high-career-and-technical-education.jpg",
  celebrations: "high-celebrations-commemorations-and-festivals.jpg",
  "teacher-development": "high-teacher-professional-development.jpg",
  "world-languages": "high-languages.jpg",
  sociology: "high-health.jpg",
  "us-history": "high-history.jpg",
}

const BANNERS_DIR = path.resolve(__dirname, "../../public/clickview/banners")

// ClickView directory name → catalog subject slug
const DIR_TO_SLUG: Record<string, string> = {
  // Elementary
  "us-elementary-arts": "the-arts",
  "us-elementary-celebrations-commemorations-and-festivals": "celebrations",
  "us-elementary-civics-and-government": "civics-citizenship",
  "us-elementary-computer-science-and-technology": "ict",
  "us-elementary-earth-and-space-science": "earth-space-sciences",
  "us-elementary-economics": "business-economics",
  "us-elementary-english-language-arts": "english",
  "us-elementary-geography": "geography",
  "us-elementary-health": "health",
  "us-elementary-history": "history",
  "us-elementary-life-science": "biology",
  "us-elementary-life-skills": "life-skills",
  "us-elementary-math": "mathematics",
  "us-elementary-physical-education": "physical-education",
  "us-elementary-physical-science": "physics",
  "us-elementary-religion": "islamic-education",
  "us-elementary-teacher-professional-development": "teacher-development",
  "us-elementary-world-languages": "world-languages",
  // Middle (subjects not covered by elementary)
  "us-middle-careers-and-technical-education": "career-education",
  "us-middle-chemical-science": "chemistry",
  "us-middle-computer-science-and-technology": "computer-science",
  "us-middle-science-and-engineering-practices": "science-engineering",
  "us-middle-u-s-history": "us-history",
  "us-middle-world-history": "world-history",
  "us-middle-religion-and-ethics": "islamic-education",
}

const BY_URL_DIR = path.resolve(__dirname, "../../public/clickview/by-url")

/**
 * Find the first image file in a directory.
 */
function findFirstImage(dirPath: string): string | null {
  if (!fs.existsSync(dirPath)) return null
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
  if (files.length === 0) return null
  return path.join(dirPath, files[0])
}

export async function seedCatalogImages(prisma: PrismaClient): Promise<void> {
  // Track which slugs already have a thumbnail
  const processed = new Set<string>()
  let uploadCount = 0

  // --- Phase 1: Curated banners (highest quality) ---
  console.log("  Phase 1: Curated banners from public/clickview/banners/")

  for (const [slug, filename] of Object.entries(BANNER_MAP)) {
    if (processed.has(slug)) continue

    const filePath = path.join(BANNERS_DIR, filename)
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${slug}: banner file not found (${filename})`)
      continue
    }

    const subject = await prisma.catalogSubject.findUnique({
      where: { slug },
      select: { id: true, thumbnailKey: true },
    })
    if (!subject) {
      console.log(`  Skipping ${slug}: not found in database`)
      continue
    }
    if (subject.thumbnailKey) {
      console.log(`  Skipping ${slug}: already has thumbnailKey`)
      processed.add(slug)
      continue
    }

    const fileBuffer = fs.readFileSync(filePath)
    const key = `catalog/subjects/${slug}/thumbnail`

    try {
      await processAndUploadCatalogImage(fileBuffer, key)
      await prisma.catalogSubject.update({
        where: { slug },
        data: { thumbnailKey: key },
      })
      uploadCount++
      console.log(`  Uploaded ${slug} (banner: ${filename})`)
    } catch (err) {
      console.error(`  Failed to upload ${slug}:`, err)
    }

    processed.add(slug)
  }

  // --- Phase 2: ClickView by-url topic images (fallback) ---
  console.log("  Phase 2: Topic images from public/clickview/by-url/")

  for (const [dirName, slug] of Object.entries(DIR_TO_SLUG)) {
    if (processed.has(slug)) continue

    const dirPath = path.join(BY_URL_DIR, dirName)
    const imagePath = findFirstImage(dirPath)
    if (!imagePath) {
      console.log(`  Skipping ${slug}: no images found in ${dirName}`)
      continue
    }

    // Check subject exists
    const subject = await prisma.catalogSubject.findUnique({
      where: { slug },
      select: { id: true, thumbnailKey: true },
    })
    if (!subject) {
      console.log(`  Skipping ${slug}: not found in database`)
      continue
    }

    // Skip if already has a thumbnail
    if (subject.thumbnailKey) {
      console.log(`  Skipping ${slug}: already has thumbnailKey`)
      processed.add(slug)
      continue
    }

    const fileBuffer = fs.readFileSync(imagePath)
    const key = `catalog/subjects/${slug}/thumbnail`

    try {
      await processAndUploadCatalogImage(fileBuffer, key)
      await prisma.catalogSubject.update({
        where: { slug },
        data: { thumbnailKey: key },
      })
      uploadCount++
      console.log(`  Uploaded ${slug} (${path.basename(imagePath)})`)
    } catch (err) {
      console.error(`  Failed to upload ${slug}:`, err)
    }

    processed.add(slug)
  }

  // Handle targeted picks: specific files from directories already mapped to other slugs
  const targetedPicks: Array<{
    slug: string
    dir: string
    filePattern: RegExp
  }> = [
    {
      slug: "arabic",
      dir: "us-elementary-world-languages",
      filePattern: /arabic/i,
    },
    {
      slug: "french",
      dir: "us-elementary-world-languages",
      filePattern: /french/i,
    },
    {
      slug: "science",
      dir: "us-elementary-life-science",
      filePattern: /\.(jpg|jpeg|png)$/i,
    },
    {
      slug: "social-studies",
      dir: "us-elementary-civics-and-government",
      filePattern: /\.(jpg|jpeg|png)$/i,
    },
    {
      slug: "sudan-history",
      dir: "us-elementary-history",
      filePattern: /\.(jpg|jpeg|png)$/i,
    },
    {
      slug: "quran",
      dir: "us-elementary-religion",
      filePattern: /islam/i,
    },
    {
      slug: "music",
      dir: "uncategorized-high",
      filePattern: /music-composition/i,
    },
    {
      slug: "psychology",
      dir: "uncategorized-high",
      filePattern: /psychology/i,
    },
    {
      slug: "sociology",
      dir: "uncategorized-high",
      filePattern: /sociol/i,
    },
  ]

  for (const { slug, dir, filePattern } of targetedPicks) {
    if (processed.has(slug)) continue

    const dirPath = path.join(BY_URL_DIR, dir)
    if (!fs.existsSync(dirPath)) continue

    const files = fs.readdirSync(dirPath)
    const fileName = files.find((f) => filePattern.test(f))
    if (!fileName) {
      console.log(`  Skipping ${slug}: no matching file in ${dir}`)
      continue
    }

    const subject = await prisma.catalogSubject.findUnique({
      where: { slug },
      select: { id: true, thumbnailKey: true },
    })
    if (!subject) {
      console.log(`  Skipping ${slug}: not found in database`)
      continue
    }
    if (subject.thumbnailKey) {
      console.log(`  Skipping ${slug}: already has thumbnailKey`)
      processed.add(slug)
      continue
    }

    const filePath = path.join(dirPath, fileName)
    const fileBuffer = fs.readFileSync(filePath)
    const key = `catalog/subjects/${slug}/thumbnail`

    try {
      await processAndUploadCatalogImage(fileBuffer, key)
      await prisma.catalogSubject.update({
        where: { slug },
        data: { thumbnailKey: key },
      })
      uploadCount++
      console.log(`  Uploaded ${slug} (${fileName})`)
    } catch (err) {
      console.error(`  Failed to upload ${slug}:`, err)
    }

    processed.add(slug)
  }

  logSuccess("CatalogImages", uploadCount, "S3/CloudFront")
}
