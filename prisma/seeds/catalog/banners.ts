// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Banner Copy Seed
 *
 * Copies old curated wide banners (2048x378) from their
 * legacy S3 paths to the new concept-based paths for all 12 grades.
 *
 * Old path: catalog/subjects/{old-slug}/banner-{size}.webp
 * New path: catalog/concepts/g{grade}-{concept}/banner-{size}.webp
 *
 * The concept-images seed uploaded square concept illustrations to
 * banner paths, but hero sections need wide landscape images.
 * The old curated banners are still on S3 — this seed copies them.
 *
 * Usage: pnpm db:seed:single banners
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

import { CONCEPT_POOL } from "../../../src/components/catalog/concepts-data"
import { logSuccess } from "../utils"

// ============================================================================
// Config
// ============================================================================

const VARIANTS = ["sm", "md", "lg", "original"] as const
const MAX_GRADE = 12

// Old S3 slug → concept name (23 unique mappings)
const OLD_SLUG_TO_CONCEPT: Record<string, string> = {
  "the-arts": "arts",
  english: "english",
  french: "languages",
  mathematics: "math",
  science: "science",
  physics: "physics",
  chemistry: "chemistry",
  biology: "biology",
  "earth-space-sciences": "earth-science",
  "computer-science": "computer-science",
  history: "history",
  geography: "geography",
  "social-studies": "civics",
  "business-economics": "economics",
  psychology: "psychology",
  "islamic-education": "religion",
  "physical-education": "pe",
  health: "health",
  "life-skills": "life-skills",
  "career-education": "career-tech",
  celebrations: "celebrations",
  "teacher-development": "teacher-pd",
  sociology: "sociology",
}

/**
 * Pick a borrowed banner source for a concept whose own legacy banner is
 * unavailable: walk the concept's CONCEPT_POOL neighbor chain and take the
 * first concept that did download, falling back to any downloaded concept.
 * Guarantees every pool concept ships a banner as long as at least one
 * legacy banner exists.
 */
export function resolveBannerSource(
  concept: string,
  downloaded: ReadonlySet<string>
): string | null {
  const chain = CONCEPT_POOL[concept] ?? []
  for (const neighbor of chain) {
    if (neighbor !== concept && downloaded.has(neighbor)) return neighbor
  }
  const first = [...downloaded].sort()[0]
  return first ?? null
}

// ============================================================================
// S3 Client (lazy singleton)
// ============================================================================

let s3: S3Client | null = null

function getS3(): S3Client {
  if (!s3) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials not configured")
    }
    s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return s3
}

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) throw new Error("AWS_S3_BUCKET not configured")
  return bucket
}

// ============================================================================
// Main
// ============================================================================

async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<Response | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) return null
      return response
    } catch {
      if (attempt === retries) return null
      // Exponential backoff: 2s, 4s, 8s
      await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
  return null
}

export async function seedConceptBanners(): Promise<void> {
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN
  if (!cloudfrontDomain) {
    throw new Error("CLOUDFRONT_DOMAIN not configured")
  }

  const client = getS3()
  const bucket = getBucket()
  const entries = Object.entries(OLD_SLUG_TO_CONCEPT)
  let uploadCount = 0
  let skipped = 0

  async function uploadVariant(
    concept: string,
    variant: (typeof VARIANTS)[number],
    buffer: Buffer
  ) {
    for (let grade = 1; grade <= MAX_GRADE; grade++) {
      const newKey = `catalog/concepts/g${grade}-${concept}/banner-${variant}.webp`
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: newKey,
          Body: buffer,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        })
      )
      uploadCount++
    }
  }

  // Phase 1: download each concept's legacy banner variants (keep the
  // buffers — fallbacks reuse them without re-fetching) and upload to the
  // concept-based grade paths.
  const downloadedBuffers = new Map<string, Map<string, Buffer>>()

  for (const [oldSlug, concept] of entries) {
    for (const variant of VARIANTS) {
      const oldUrl = `https://${cloudfrontDomain}/catalog/subjects/${oldSlug}/banner-${variant}.webp`

      const response = await fetchWithRetry(oldUrl)
      if (!response) {
        console.log(`  Skipping ${oldSlug}/banner-${variant}: fetch failed`)
        skipped++
        continue
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      let byVariant = downloadedBuffers.get(concept)
      if (!byVariant) {
        byVariant = new Map()
        downloadedBuffers.set(concept, byVariant)
      }
      byVariant.set(variant, buffer)

      await uploadVariant(concept, variant, buffer)
    }

    if (downloadedBuffers.has(concept)) {
      console.log(`  Copied ${oldSlug} → ${concept} (g1–g${MAX_GRADE})`)
    }
  }

  if (skipped > 0) {
    console.log(`  Skipped ${skipped} variants (fetch failures)`)
  }

  // Phase 2: every pool concept without its own legacy banner borrows the
  // nearest downloaded neighbor's (CONCEPT_POOL chain order) so no subject
  // page ever renders a 404 banner.
  const downloaded = new Set(downloadedBuffers.keys())
  const poolConcepts = Object.keys(CONCEPT_POOL)
  let borrowed = 0

  for (const concept of poolConcepts) {
    if (downloaded.has(concept)) continue

    const source = resolveBannerSource(concept, downloaded)
    if (!source) {
      console.log(`  No banner source available for ${concept} — skipping`)
      continue
    }

    const byVariant = downloadedBuffers.get(source)!
    for (const [variant, buffer] of byVariant) {
      await uploadVariant(concept, variant as (typeof VARIANTS)[number], buffer)
    }
    borrowed++
    console.log(`  Fallback: ${concept} ← ${source} banner (g1–g${MAX_GRADE})`)
  }

  logSuccess(
    "Banner Copy",
    uploadCount,
    `S3 objects (${downloaded.size} own + ${borrowed} borrowed concepts × ${VARIANTS.length} variants × ${MAX_GRADE} grades)`
  )
}
