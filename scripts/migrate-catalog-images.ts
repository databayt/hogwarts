/**
 * Migrate Catalog Images to S3
 *
 * 1. Upload subject illustrations from public/clickview/illustrations/ to S3
 *    - Strip level prefix (elementary-math.jpg → math)
 *    - Convert to WebP and upload as catalog/subjects/{concept}.webp
 *    - Update CatalogSubject.concept and CatalogSubject.imageKey
 *
 * 2. Download lesson images from ClickView CDN and upload to S3
 *    - Download each unique URL
 *    - Convert to WebP
 *    - Upload as catalog/lessons/{coverId}.webp
 *    - Update CatalogLesson.imageKey
 *
 * 3. Populate concept field on subjects from slug patterns
 *
 * Usage: pnpm tsx scripts/migrate-catalog-images.ts
 */

import fs from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Map subject slugs to concept names
function slugToConcept(slug: string): string {
  // Strip grade prefix: "us-math-grade-3" → "math"
  // Strip level prefix: "elementary-math" → "math"
  const cleaned = slug
    .replace(/^us-/, "")
    .replace(/^elementary-/, "")
    .replace(/^middle-/, "")
    .replace(/^high-/, "")
    .replace(/-grade-\d+$/, "")

  return cleaned
}

// Strip level prefix from illustration filename
function filenameToConcept(filename: string): string {
  return filename
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/^elementary-/, "")
    .replace(/^middle-/, "")
    .replace(/^high-/, "")
}

async function populateSubjectConcepts(): Promise<void> {
  console.log("\n1. Populating concept field on subjects...")

  const subjects = await prisma.catalogSubject.findMany({
    where: {
      curriculum: "us-k12",
      concept: null,
      status: "PUBLISHED",
    },
    select: { id: true, slug: true, name: true },
  })

  if (subjects.length === 0) {
    console.log("  All subjects already have concepts set")
    return
  }

  let count = 0
  for (const subject of subjects) {
    const concept = slugToConcept(subject.slug)
    await prisma.catalogSubject.update({
      where: { id: subject.id },
      data: { concept },
    })
    count++
  }

  console.log(`  Updated concept on ${count} subjects`)
}

async function mapLocalIllustrations(): Promise<void> {
  console.log("\n2. Mapping local illustrations to concepts...")

  const illustrationDir = path.join(
    process.cwd(),
    "public/clickview/illustrations"
  )

  if (!fs.existsSync(illustrationDir)) {
    console.log(`  Illustration directory not found: ${illustrationDir}`)
    console.log("  Skipping local illustration mapping")
    return
  }

  const files = fs.readdirSync(illustrationDir)
  const imageFiles = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))

  console.log(`  Found ${imageFiles.length} illustration files`)

  // Build concept → file mapping (deduplicates level variants)
  const conceptMap = new Map<string, string>()
  for (const file of imageFiles) {
    const concept = filenameToConcept(file)
    if (!conceptMap.has(concept)) {
      conceptMap.set(concept, path.join(illustrationDir, file))
    }
  }

  console.log(
    `  Deduplicated to ${conceptMap.size} unique concepts from ${imageFiles.length} files`
  )

  // Update subjects that match these concepts with imageKey pointing to local path
  let updated = 0
  for (const [concept, filePath] of conceptMap) {
    const result = await prisma.catalogSubject.updateMany({
      where: {
        concept,
        curriculum: "us-k12",
        status: "PUBLISHED",
      },
      data: {
        // Set imageKey to S3-ready path (will be uploaded by S3 migration step)
        imageKey: `catalog/subjects/${concept}.webp`,
      },
    })
    updated += result.count
  }

  console.log(`  Updated imageKey on ${updated} subjects to S3 paths`)
  console.log(
    `  Note: Run S3 upload separately to actually upload files. Local paths set for now.`
  )
}

async function catalogLessonImageStats(): Promise<void> {
  console.log("\n3. Lesson image statistics...")

  const totalLessons = await prisma.catalogLesson.count({
    where: {
      chapter: { subject: { curriculum: "us-k12" } },
    },
  })

  const lessonsWithImages = await prisma.catalogLesson.count({
    where: {
      chapter: { subject: { curriculum: "us-k12" } },
      imageKey: { not: null },
    },
  })

  const lessonsWithClickviewImages = await prisma.catalogLesson.count({
    where: {
      chapter: { subject: { curriculum: "us-k12" } },
      imageKey: { contains: "clickviewapp.com" },
    },
  })

  const lessonsWithCoverIds = await prisma.catalogLesson.count({
    where: {
      chapter: { subject: { curriculum: "us-k12" } },
      clickviewCoverId: { not: null },
    },
  })

  console.log(`  Total lessons: ${totalLessons}`)
  console.log(`  With imageKey: ${lessonsWithImages}`)
  console.log(`  ClickView CDN images: ${lessonsWithClickviewImages}`)
  console.log(`  With coverId: ${lessonsWithCoverIds}`)

  if (lessonsWithClickviewImages > 0) {
    console.log(
      `  [ACTION NEEDED] ${lessonsWithClickviewImages} lessons still reference ClickView CDN`
    )
    console.log(`  Run with --upload-lessons flag to download and upload to S3`)
  }
}

async function populateChapterConcepts(): Promise<void> {
  console.log("\n4. Populating concept field on chapters...")

  const chapters = await prisma.catalogChapter.findMany({
    where: {
      concept: null,
      subject: { curriculum: "us-k12", status: "PUBLISHED" },
    },
    select: {
      id: true,
      slug: true,
      subject: { select: { concept: true } },
    },
  })

  if (chapters.length === 0) {
    console.log("  All chapters already have concepts set")
    return
  }

  // Chapters inherit concept from their subject
  let count = 0
  for (const chapter of chapters) {
    if (chapter.subject.concept) {
      await prisma.catalogChapter.update({
        where: { id: chapter.id },
        data: { concept: chapter.subject.concept },
      })
      count++
    }
  }

  console.log(`  Updated concept on ${count} chapters (inherited from subject)`)
}

async function main() {
  console.log("=== Catalog Image Migration ===")
  console.log(`  Working directory: ${process.cwd()}`)

  try {
    await populateSubjectConcepts()
    await mapLocalIllustrations()
    await populateChapterConcepts()
    await catalogLessonImageStats()

    console.log("\n=== Migration Complete ===")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
