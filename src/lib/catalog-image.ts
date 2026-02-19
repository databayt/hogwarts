/**
 * Catalog Image Processing Pipeline
 *
 * Processes uploaded images into WebP variants via Sharp,
 * uploads to S3, and constructs CDN URLs via CloudFront.
 *
 * Variants:
 *   - sm (200px)  → list views, cards
 *   - md (600px)  → detail views
 *   - lg (1200px) → hero/banner views
 *   - original    → full resolution, max quality
 *
 * Fallback: If thumbnailKey is null, falls back to static /subjects/{imageKey}.png
 */

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import sharp from "sharp"

import { getCloudFrontUrl, isCloudFrontConfigured } from "@/lib/cloudfront"

// --- Variant Definitions ---

export const CATALOG_IMAGE_VARIANTS = [
  { suffix: "sm", width: 200, quality: 95 },
  { suffix: "md", width: 600, quality: 97 },
  { suffix: "lg", width: 1200, quality: 100 },
  { suffix: "original", width: null, quality: 100 },
] as const

export type CatalogImageSize = (typeof CATALOG_IMAGE_VARIANTS)[number]["suffix"]

// --- S3 Client (lazy singleton) ---

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

// --- Core Processing ---

/**
 * Process an image buffer into WebP variants and upload to S3.
 *
 * @param fileBuffer - Raw image file buffer
 * @param key - S3 key prefix, e.g. "catalog/subjects/{id}/thumbnail"
 * @returns The key prefix (same as input) for storage in database
 */
export async function processAndUploadCatalogImage(
  fileBuffer: Buffer,
  key: string
): Promise<string> {
  const client = getS3()
  const bucket = getBucket()

  const uploads = CATALOG_IMAGE_VARIANTS.map(
    async ({ suffix, width, quality }) => {
      let pipeline = sharp(fileBuffer)

      if (width) {
        pipeline = pipeline.resize(width, null, {
          withoutEnlargement: true,
          fit: "inside",
        })
      }

      const webpOptions =
        suffix === "original"
          ? { lossless: true, effort: 6 }
          : quality === 100
            ? {
                quality,
                effort: 6,
                nearLossless: true,
                preset: "photo" as const,
              }
            : { quality, effort: 6, preset: "photo" as const }

      const webpBuffer = await pipeline.webp(webpOptions).toBuffer()

      const s3Key = `${key}-${suffix}.webp`

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: webpBuffer,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        })
      )

      return s3Key
    }
  )

  await Promise.all(uploads)
  return key
}

// --- URL Resolution ---

/**
 * Get the CDN display URL for a catalog image.
 * Returns a CloudFront URL for the given S3 key, or null if unavailable.
 */
export function getCatalogImageUrl(
  thumbnailKey: string | null | undefined,
  _imageKey: string | null | undefined,
  size: CatalogImageSize = "original"
): string | null {
  if (thumbnailKey && isCloudFrontConfigured()) {
    return getCloudFrontUrl(`${thumbnailKey}-${size}.webp`)
  }

  return null
}

/**
 * Build a srcSet string for responsive loading.
 * Only works with CDN thumbnails (not static fallbacks).
 */
export function getCatalogImageSrcSet(
  thumbnailKey: string | null | undefined
): string | undefined {
  if (!thumbnailKey || !isCloudFrontConfigured()) return undefined

  return [
    `${getCloudFrontUrl(`${thumbnailKey}-sm.webp`)} 200w`,
    `${getCloudFrontUrl(`${thumbnailKey}-md.webp`)} 600w`,
    `${getCloudFrontUrl(`${thumbnailKey}-lg.webp`)} 1200w`,
    `${getCloudFrontUrl(`${thumbnailKey}-original.webp`)} 3840w`,
  ].join(", ")
}

// --- Deletion ---

/**
 * Delete all WebP variants for a catalog image from S3.
 */
export async function deleteCatalogImage(key: string): Promise<void> {
  const client = getS3()
  const bucket = getBucket()

  const deletions = CATALOG_IMAGE_VARIANTS.map(({ suffix }) =>
    client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: `${key}-${suffix}.webp`,
      })
    )
  )

  await Promise.all(deletions)
}
