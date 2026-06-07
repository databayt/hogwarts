// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Concept Images Seed
 *
 * Universal, curriculum-agnostic image layer.
 *
 * Reads clean-named source images from public/subjects/concepts/,
 * processes through Sharp → WebP variants → S3/CloudFront,
 * and uploads to grade-specific S3 paths for all 12 grades (g1–g12).
 *
 * S3 key pattern: catalog/concepts/g{grade}-{concept}/thumbnail
 *   → catalog/concepts/g7-math/thumbnail-sm.webp
 *   → catalog/concepts/g7-math/thumbnail-md.webp
 *   → catalog/concepts/g7-math/thumbnail-lg.webp
 *   → catalog/concepts/g7-math/thumbnail-original.webp
 *
 * For now, all grades share the same source image per concept.
 * To add grade-specific images later, just upload to the specific
 * grade path (e.g. math-g7/) and it overrides automatically.
 *
 * Usage: pnpm db:seed:single concepts
 */

import fs from "fs"
import path from "path"
import type { PrismaClient } from "@prisma/client"

import { processAndUploadCatalogImage } from "../../../src/components/catalog/image"
import { logSuccess } from "../utils"

const CONCEPTS_DIR = path.resolve(
  __dirname,
  "../../../public/subjects/concepts"
)
const MAX_GRADE = 12

// ============================================================================
// Subject name → concept mapping (covers all curricula)
// ============================================================================

const NAME_TO_CONCEPT: Record<string, string> = {
  // US K-12
  Arts: "arts",
  "Business and Economics": "economics",
  "Career and Technical Education": "career-tech",
  "Careers and Technical Education": "career-tech",
  "Celebrations, Commemorations and Festivals": "celebrations",
  "Chemical Science": "chemistry",
  Chemistry: "chemistry",
  "Civics and Government": "civics",
  "Computer Science and Technology": "computer-science",
  "Earth and Space Science": "earth-science",
  Economics: "economics",
  "English Language Arts": "english",
  Geography: "geography",
  Health: "health",
  History: "history",
  "Life Science": "biology",
  "Life Sciences": "biology",
  "Life Skills": "life-skills",
  Math: "math",
  "Physical Education": "pe",
  "Physical Science": "science",
  Physics: "physics",
  Psychology: "psychology",
  Religion: "religion",
  "Religion and Ethics": "religion",
  "Religion and Philosophy": "religion",
  "Science and Engineering Practices": "science",
  Sociology: "sociology",
  "Teacher Professional Development": "teacher-pd",
  "U.S. History": "history",
  "World History": "history",
  "World Languages": "languages",

  // Sudan national curriculum
  "اللغة العربية": "languages",
  الرياضيات: "math",
  "التربية الإسلامية": "religion",
  "اللغة الإنجليزية": "english",
  العلوم: "science",
  التاريخ: "history",
  الجغرافيا: "geography",
  الفنية: "arts",
  "علوم الحاسوب": "computer-science",
  الفيزياء: "physics",
  الكيمياء: "chemistry",
  الأحياء: "biology",
  "الدراسات الإسلامية": "religion",
  "القرآن وعلومه": "religion",
  "اللغة الفرنسية": "languages",
  "البلاغة والتعبير": "languages",
  "قواعد النحو": "languages",
  "الأدب والمطالعة": "languages",
  "اللغة العربية الخاصة": "languages",
  "العلوم العسكرية": "civics",
  "العلوم الهندسية": "science",
  "العلوم التجارية": "economics",
  "العلوم الأسرية": "health",
  "الإنتاج الزراعي والحيواني": "biology",
  "الرياضيات الأساسية": "math",
  "الفنون والتصميم": "arts",
  "تكنولوجيا الاتصالات": "computer-science",
  "أساسيات التربية التقنية": "career-tech",
}

// ============================================================================
// Main seed function
// ============================================================================

export async function seedConceptImages(prisma: PrismaClient): Promise<void> {
  if (!fs.existsSync(CONCEPTS_DIR)) {
    console.log("  public/subjects/concepts/ not found, skipping")
    return
  }

  // Step 1: Upload concept images to S3 (grade-specific paths)
  const conceptFiles = fs
    .readdirSync(CONCEPTS_DIR)
    .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))

  console.log(
    `  Found ${conceptFiles.length} concept images × ${MAX_GRADE} grades`
  )

  const uploadedConcepts = new Set<string>()
  let uploadCount = 0

  for (const file of conceptFiles) {
    const concept = path.basename(file, path.extname(file))
    const filePath = path.join(CONCEPTS_DIR, file)
    const fileBuffer = fs.readFileSync(filePath)

    // Upload same image to all 12 grade paths (thumbnail only — banners
    // require proper wide landscape images and are handled by banner-copy.ts)
    for (let grade = 1; grade <= MAX_GRADE; grade++) {
      const prefix = `catalog/concepts/g${grade}-${concept}`

      try {
        await processAndUploadCatalogImage(fileBuffer, `${prefix}/thumbnail`)
        uploadCount++
      } catch (err) {
        console.error(`  Failed to upload g${grade}-${concept}:`, err)
      }
    }

    uploadedConcepts.add(concept)
    console.log(`  Uploaded concept: ${concept} (g1–g${MAX_GRADE}, thumbnail)`)
  }

  logSuccess(
    "Concept Images",
    uploadCount,
    `grade-specific S3 keys (${uploadedConcepts.size} concepts × ${MAX_GRADE} grades)`
  )

  // Step 2: Backfill concept field on all subjects
  console.log("  Backfilling concept field on all subjects...")

  const allSubjects = await prisma.subject.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true, concept: true },
  })

  let conceptUpdated = 0
  for (const subject of allSubjects) {
    const inferredConcept = NAME_TO_CONCEPT[subject.name]
    if (inferredConcept && subject.concept !== inferredConcept) {
      await prisma.subject.update({
        where: { id: subject.id },
        data: { concept: inferredConcept },
      })
      conceptUpdated++
    }
  }

  logSuccess("Concept Backfill", conceptUpdated, "subjects updated")

  // Step 3: Set grade-specific thumbnail on subjects that don't have one
  console.log(
    "  Setting grade-specific thumbnail on subjects without thumbnails..."
  )

  const subjectsWithoutThumbnail = await prisma.subject.findMany({
    where: {
      status: "PUBLISHED",
      thumbnail: null,
      concept: { not: null },
    },
    select: { id: true, concept: true, grades: true },
  })

  let thumbnailCount = 0
  for (const subject of subjectsWithoutThumbnail) {
    if (!subject.concept || !uploadedConcepts.has(subject.concept)) continue

    const grade = subject.grades[0] ?? 1
    const prefix = `catalog/concepts/g${grade}-${subject.concept}`

    await prisma.subject.update({
      where: { id: subject.id },
      data: {
        thumbnail: `${prefix}/thumbnail`,
      },
    })
    thumbnailCount++
  }

  logSuccess(
    "Shared Thumbnails",
    thumbnailCount,
    "subjects got grade-specific thumbnail"
  )
}
