/**
 * CloudFront CDN utility for video streaming
 *
 * Handles:
 * - URL generation (CloudFront vs raw S3 fallback)
 * - Signed URLs for paid content protection (4-hour expiry)
 * - Cache invalidation on video re-upload
 *
 * SETUP: Requires CloudFront env vars in .env:
 * - CLOUDFRONT_DOMAIN
 * - CLOUDFRONT_KEY_PAIR_ID (for signed URLs)
 * - CLOUDFRONT_PRIVATE_KEY (PEM, for signed URLs)
 * - CLOUDFRONT_DISTRIBUTION_ID (for cache invalidation)
 */

import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront"
import { getSignedUrl } from "@aws-sdk/cloudfront-signer"

// Lazy-init CloudFront client (only needed for cache invalidation)
let cfClient: CloudFrontClient | null = null

function getCloudFrontClient(): CloudFrontClient | null {
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID
  if (!distributionId) return null

  if (!cfClient) {
    cfClient = new CloudFrontClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    })
  }
  return cfClient
}

/**
 * Check if CDN/S3 image serving is configured.
 * Returns true when CloudFront domain OR S3 bucket is available,
 * since getCloudFrontUrl() falls back to direct S3 URLs.
 */
export function isCloudFrontConfigured(): boolean {
  return !!(process.env.CLOUDFRONT_DOMAIN || process.env.AWS_S3_BUCKET)
}

/**
 * Check if signed URLs are available
 */
function isSigningConfigured(): boolean {
  return !!(
    process.env.CLOUDFRONT_KEY_PAIR_ID && process.env.CLOUDFRONT_PRIVATE_KEY
  )
}

/**
 * Convert an S3 key to a CloudFront URL
 * Falls back to raw S3 URL if CloudFront not configured
 */
export function getCloudFrontUrl(s3Key: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN
  if (!domain) {
    // Fallback to raw S3
    const bucket = process.env.AWS_S3_BUCKET
    const region = process.env.AWS_REGION || "us-east-1"
    if (!bucket) return s3Key
    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`
  }

  return `https://${domain}/${s3Key}`
}

/**
 * Convert any video URL to use CloudFront if applicable
 * - S3 URLs → CloudFront URL
 * - YouTube/Vimeo URLs → pass through
 * - Already CloudFront URLs → pass through
 */
export function toCloudFrontUrl(url: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN
  if (!domain) return url

  // Already a CloudFront URL
  if (url.includes(domain)) return url

  // YouTube/Vimeo — pass through
  if (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com")
  ) {
    return url
  }

  // Vercel Blob — can't serve via our CloudFront
  if (url.includes("vercel-storage.com") || url.includes("blob.vercel")) {
    return url
  }

  // S3 URL → extract key and rewrite
  const s3Match = url.match(/https?:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/)
  if (s3Match) {
    return `https://${domain}/${s3Match[1]}`
  }

  return url
}

/**
 * Get video URL for lesson playback
 *
 * - Free lessons → unsigned CloudFront URL (or raw S3 fallback)
 * - Paid lessons → signed CloudFront URL with 4-hour expiry
 * - YouTube/Vimeo → pass through unchanged
 */
export function getVideoUrl(
  videoUrl: string,
  options: {
    isFree?: boolean
    expirySeconds?: number
  } = {}
): string {
  const { isFree = false, expirySeconds = 4 * 60 * 60 } = options

  // YouTube/Vimeo — pass through
  if (
    videoUrl.includes("youtube.com") ||
    videoUrl.includes("youtu.be") ||
    videoUrl.includes("vimeo.com")
  ) {
    return videoUrl
  }

  // Convert to CloudFront URL
  const cfUrl = toCloudFrontUrl(videoUrl)

  // Free lessons or no signing config → unsigned URL
  if (isFree || !isSigningConfigured()) {
    return cfUrl
  }

  // Paid lessons → signed URL
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID!
  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY!

  const dateLessThan = new Date(Date.now() + expirySeconds * 1000).toISOString()

  return getSignedUrl({
    url: cfUrl,
    keyPairId,
    privateKey,
    dateLessThan,
  })
}

/**
 * Invalidate CloudFront cache for given paths
 * Used when a teacher re-uploads or deletes a lesson video
 */
export async function invalidateCache(paths: string[]): Promise<void> {
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID
  if (!distributionId || paths.length === 0) return

  const client = getCloudFrontClient()
  if (!client) return

  // Ensure paths start with /
  const normalizedPaths = paths.map((p) => (p.startsWith("/") ? p : `/${p}`))

  await client.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: normalizedPaths.length,
          Items: normalizedPaths,
        },
        CallerReference: `invalidation-${Date.now()}`,
      },
    })
  )
}
