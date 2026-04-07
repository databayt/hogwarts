/**
 * Upload ALL Sudan curriculum textbook PDFs to S3
 *
 * Scans curriculum/sd/ for textbook.pdf files and uploads them to S3 at:
 *   catalog/textbooks/{slug}/textbook.pdf
 *
 * Then updates the `pdf` field on matching catalog_subjects records.
 *
 * Usage: npx tsx scripts/upload-textbooks-all.ts [--dry-run]
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs"
import { join, resolve } from "path"
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { PrismaClient } from "@prisma/client"
import { config } from "dotenv"

config()

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET!
const CURRICULUM_DIR = resolve(__dirname, "../curriculum/sd")
const DRY_RUN = process.argv.includes("--dry-run")

// Same slug resolution as sync-sd-curriculum.ts
const DIR_TO_SLUG: Record<string, string> = {
  islamic: "islamic-studies",
  "islamic-studies": "islamic-studies",
  ict: "computer",
  "commercial-studies": "commerce",
  "military-science": "military-sciences",
  "arabic-specialized": "arabic-advanced",
  quran: "quran-studies",
  "arabic-literature": "literature",
  "arabic-rhetoric": "rhetoric",
  "arabic-grammar": "grammar",
  "home-economics": "family-sciences",
}

const GRADE_OVERRIDES: Record<string, Record<string, string>> = {
  g2: { art: "arts" },
  g4: { art: "arts", english: "english-v2" },
  g5: {
    art: "arts",
    "home-economics": "home-economics",
    technology: "technology",
  },
  g6: {
    islamic: "islamic-studies",
    arabic: "arabic-v2",
    ict: "technology",
    technology: "technology",
  },
  g7: { islamic: "islamic-education", ict: "ict" },
  g8: { islamic: "islamic-education", technology: "technology" },
  g9: {
    islamic: "islamic-studies",
    ict: "communication-tech",
    "technical-education": "technical-education",
  },
  g10: {
    art: "art",
    english: "english-v2",
    "home-economics": "home-economics",
    quran: "quran",
  },
  g11: {
    art: "arts-design",
    arabic: "arabic-advanced",
    "home-economics": "family-sciences",
  },
  g12: {
    islamic: "islamic-studies",
    arabic: "arabic-advanced",
    math: "basic-math",
    "home-economics": "family-sciences",
  },
}

function resolveSlug(grade: string, dirSubject: string): string {
  const gradeOv = GRADE_OVERRIDES[grade]
  if (gradeOv?.[dirSubject]) return `sd-${grade}-${gradeOv[dirSubject]}`
  if (DIR_TO_SLUG[dirSubject]) return `sd-${grade}-${DIR_TO_SLUG[dirSubject]}`
  return `sd-${grade}-${dirSubject}`
}

async function exists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function upload(key: string, filePath: string): Promise<void> {
  const body = readFileSync(filePath)
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "application/pdf",
      CacheControl: "public, max-age=31536000, immutable",
    })
  )
}

async function main() {
  console.log(
    `${DRY_RUN ? "[DRY RUN] " : ""}Uploading textbooks to S3 bucket: ${BUCKET}\n`
  )

  // Scan for all textbook.pdf files
  interface TextbookEntry {
    grade: string
    subject: string
    slug: string
    filePath: string
    sizeMB: number
    s3Key: string
  }

  const entries: TextbookEntry[] = []

  for (let g = 1; g <= 12; g++) {
    const grade = `g${g}`
    const gradePath = join(CURRICULUM_DIR, grade)
    if (!existsSync(gradePath)) continue

    for (const subject of readdirSync(gradePath)) {
      const subjectPath = join(gradePath, subject)
      if (!statSync(subjectPath).isDirectory()) continue

      const pdfPath = join(subjectPath, "textbook.pdf")
      if (!existsSync(pdfPath)) continue

      const slug = resolveSlug(grade, subject)
      const sizeMB = statSync(pdfPath).size / 1024 / 1024

      entries.push({
        grade,
        subject,
        slug,
        filePath: pdfPath,
        sizeMB,
        s3Key: `catalog/textbooks/${slug}/textbook.pdf`,
      })
    }
  }

  console.log(`Found ${entries.length} textbook PDFs\n`)

  let uploaded = 0
  let skipped = 0
  let failed = 0
  const dbUpdates: Array<{ slug: string; pdfKey: string }> = []

  for (const entry of entries) {
    const prefix = `  ${entry.slug} (${entry.sizeMB.toFixed(1)} MB)`

    if (DRY_RUN) {
      console.log(`${prefix} -> ${entry.s3Key}`)
      dbUpdates.push({ slug: entry.slug, pdfKey: entry.s3Key })
      uploaded++
      continue
    }

    // Check if already uploaded
    const alreadyExists = await exists(entry.s3Key)
    if (alreadyExists) {
      console.log(`${prefix} [already in S3, skip upload]`)
      dbUpdates.push({ slug: entry.slug, pdfKey: entry.s3Key })
      skipped++
      continue
    }

    try {
      await upload(entry.s3Key, entry.filePath)
      console.log(`${prefix} [uploaded]`)
      dbUpdates.push({ slug: entry.slug, pdfKey: entry.s3Key })
      uploaded++
    } catch (err) {
      console.error(
        `${prefix} [FAILED: ${err instanceof Error ? err.message : err}]`
      )
      failed++
    }
  }

  console.log(
    `\nS3: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`
  )

  // Update DB pdf field
  if (!DRY_RUN && dbUpdates.length > 0) {
    console.log(`\nUpdating ${dbUpdates.length} DB records...`)
    const prisma = new PrismaClient()
    try {
      let dbUpdated = 0
      for (const { slug, pdfKey } of dbUpdates) {
        try {
          await prisma.subject.update({
            where: { slug },
            data: { pdf: pdfKey },
          })
          dbUpdated++
        } catch {
          // Subject might not exist in DB yet
          console.log(`  [skip DB] ${slug} not found in DB`)
        }
      }
      console.log(`DB: ${dbUpdated} subjects updated with pdf field`)
    } finally {
      await prisma.$disconnect()
    }
  }

  console.log("\nDone!")
}

main().catch(console.error)
