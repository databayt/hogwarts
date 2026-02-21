/**
 * Lightweight CloudFront URL helpers — zero AWS SDK dependencies.
 *
 * These pure functions only read env vars and do string ops,
 * so they can be imported without pulling @aws-sdk/* into the bundle.
 *
 * Heavy operations (signed URLs, cache invalidation) stay in cloudfront.ts.
 */

/**
 * Check if CDN/S3 image serving is configured.
 * Returns true when CloudFront domain OR S3 bucket is available,
 * since getCloudFrontUrl() falls back to direct S3 URLs.
 */
export function isCloudFrontConfigured(): boolean {
  return !!(process.env.CLOUDFRONT_DOMAIN || process.env.AWS_S3_BUCKET)
}

/**
 * Convert an S3 key to a CloudFront URL.
 * Falls back to raw S3 URL if CloudFront not configured.
 */
export function getCloudFrontUrl(s3Key: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN
  if (!domain) {
    const bucket = process.env.AWS_S3_BUCKET
    const region = process.env.AWS_REGION || "us-east-1"
    if (!bucket) return s3Key
    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`
  }

  return `https://${domain}/${s3Key}`
}

/**
 * Convert any video URL to use CloudFront if applicable.
 * - S3 URLs → CloudFront URL
 * - YouTube/Vimeo URLs → pass through
 * - Already CloudFront URLs → pass through
 */
export function toCloudFrontUrl(url: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN
  if (!domain) return url

  if (url.includes(domain)) return url

  if (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com")
  ) {
    return url
  }

  if (url.includes("vercel-storage.com") || url.includes("blob.vercel")) {
    return url
  }

  const s3Match = url.match(/https?:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/)
  if (s3Match) {
    return `https://${domain}/${s3Match[1]}`
  }

  return url
}
