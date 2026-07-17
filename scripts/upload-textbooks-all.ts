/**
 * Upload curriculum subject assets to S3 — textbook PDFs + per-subject art.
 *
 * Scans curriculum trees for, per subject dir:
 *   textbook.pdf   → catalog/textbooks/{slug}/textbook.pdf   (Subject.pdf)
 *   cover.jpg      → catalog/textbooks/{slug}/cover.jpg      (Subject.cover)
 *   thumbnail.jpg  → catalog/textbooks/{slug}/thumbnail.jpg  (Subject.thumbnail)
 *   banner.jpg     → catalog/textbooks/{slug}/banner.jpg     (Subject.banner)
 * uploads whatever exists (subjects without a textbook still get their art),
 * then points the matching catalog_subjects fields at the uploaded keys.
 *
 * The seed (`prisma/seeds/catalog/sd.ts`) writes the SAME keys whenever the
 * local file exists, so seed and upload never disagree; run this after adding
 * or re-rendering assets so the keys actually resolve on the CDN.
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

import { resolveSdDbSlug } from "../prisma/seeds/catalog/sd"

config()

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET!
const CURRICULUM_ROOT = resolve(__dirname, "../curriculum")
const DRY_RUN = process.argv.includes("--dry-run")

// Every curriculum tree under curriculum/ + how to build the DB Subject.slug
// it maps to (must match the seed). Sudan resolves through the seed's own
// dir→slug overrides; the other trees follow the tree-engine convention
// `${prefix}-${gradeDir}-${subjectDir}`. Add a row here when a new tree gains
// uploadable assets.
const CURRICULA: Array<{
  dir: string
  slugFor: (grade: string, subject: string) => string
}> = [
  { dir: "sd", slugFor: resolveSdDbSlug }, // Sudan (curriculum/sd → SD)
  { dir: "uk", slugFor: (g, s) => `gb-${g}-${s}` }, // England (curriculum/uk → GB)
  { dir: "in", slugFor: (g, s) => `cbse-${g}-${s}` }, // India (curriculum/in → CBSE)
]

// Per-subject-dir assets: local filename → Subject field + content type.
const SUBJECT_ASSETS = [
  { file: "textbook.pdf", field: "pdf", contentType: "application/pdf" },
  { file: "cover.jpg", field: "cover", contentType: "image/jpeg" },
  { file: "thumbnail.jpg", field: "thumbnail", contentType: "image/jpeg" },
  { file: "banner.jpg", field: "banner", contentType: "image/jpeg" },
] as const

type SubjectField = (typeof SUBJECT_ASSETS)[number]["field"]

async function exists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function upload(
  key: string,
  filePath: string,
  contentType: string
): Promise<void> {
  const body = readFileSync(filePath)
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )
}

interface AssetEntry {
  key: string
  filePath: string
  contentType: string
  field: SubjectField
  sizeMB: number
}

interface SubjectEntry {
  grade: string
  subject: string
  slug: string
  assets: AssetEntry[]
}

async function main() {
  console.log(
    `${DRY_RUN ? "[DRY RUN] " : ""}Uploading curriculum assets to S3 bucket: ${BUCKET}\n`
  )

  const entries: SubjectEntry[] = []

  for (const cur of CURRICULA) {
    const curDir = join(CURRICULUM_ROOT, cur.dir)
    if (!existsSync(curDir)) continue

    for (let g = 1; g <= 12; g++) {
      const grade = `g${g}`
      const gradePath = join(curDir, grade)
      if (!existsSync(gradePath)) continue

      for (const subject of readdirSync(gradePath)) {
        const subjectPath = join(gradePath, subject)
        if (!statSync(subjectPath).isDirectory()) continue

        const slug = cur.slugFor(grade, subject)
        const assets: AssetEntry[] = []
        for (const spec of SUBJECT_ASSETS) {
          const filePath = join(subjectPath, spec.file)
          if (!existsSync(filePath)) continue
          assets.push({
            key: `catalog/textbooks/${slug}/${spec.file}`,
            filePath,
            contentType: spec.contentType,
            field: spec.field,
            sizeMB: statSync(filePath).size / 1024 / 1024,
          })
        }

        if (assets.length > 0) entries.push({ grade, subject, slug, assets })
      }
    }
  }

  const assetCount = entries.reduce((n, e) => n + e.assets.length, 0)
  console.log(`Found ${entries.length} subjects with ${assetCount} assets\n`)

  let uploaded = 0
  let skipped = 0
  let failed = 0
  const dbUpdates: Array<{
    slug: string
    data: Partial<Record<SubjectField, string>>
  }> = []

  // Upload one asset, skipping when already in S3. Returns the outcome so the
  // caller can tally + decide whether to keep the DB pointer.
  async function put(
    asset: AssetEntry
  ): Promise<"uploaded" | "skipped" | "failed"> {
    if (DRY_RUN) return "uploaded"
    if (await exists(asset.key)) return "skipped"
    try {
      await upload(asset.key, asset.filePath, asset.contentType)
      return "uploaded"
    } catch (err) {
      console.error(
        `    [FAILED ${asset.key}: ${err instanceof Error ? err.message : err}]`
      )
      return "failed"
    }
  }

  for (const entry of entries) {
    const data: Partial<Record<SubjectField, string>> = {}
    const parts: string[] = []

    for (const asset of entry.assets) {
      const result = await put(asset)
      if (result === "uploaded") uploaded++
      else if (result === "skipped") skipped++
      else {
        failed++
        continue // failed upload → leave the DB pointer alone
      }
      // uploaded or already-in-S3: the object resolves, point the DB at it
      data[asset.field] = asset.key
      parts.push(
        `${asset.field}${asset.field === "pdf" ? ` (${asset.sizeMB.toFixed(1)} MB)` : ""} [${result}]`
      )
    }

    console.log(`  ${entry.slug}: ${parts.join(", ") || "nothing uploadable"}`)
    if (Object.keys(data).length > 0) dbUpdates.push({ slug: entry.slug, data })
  }

  console.log(
    `\nS3: ${uploaded} uploaded, ${skipped} skipped (already exist), ${failed} failed`
  )

  // Point Subject.pdf/cover/thumbnail/banner at the uploaded keys
  if (!DRY_RUN && dbUpdates.length > 0) {
    console.log(`\nUpdating ${dbUpdates.length} DB records...`)
    const prisma = new PrismaClient()
    try {
      let dbUpdated = 0
      for (const { slug, data } of dbUpdates) {
        try {
          await prisma.subject.update({ where: { slug }, data })
          dbUpdated++
        } catch {
          // Subject might not exist in DB yet
          console.log(`  [skip DB] ${slug} not found in DB`)
        }
      }
      console.log(`DB: ${dbUpdated} subjects updated`)
    } finally {
      await prisma.$disconnect()
    }
  }

  console.log("\nDone!")
}

main().catch(console.error)
