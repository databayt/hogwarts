/**
 * Client-safe catalog image URL helpers.
 *
 * Extracted from catalog-image.ts to avoid pulling sharp/S3 into the client bundle.
 */

import { getCloudFrontUrl, isCloudFrontConfigured } from "@/lib/cloudfront-url"

export type CatalogImageSize = "sm" | "md" | "lg" | "original"

/**
 * Resolve the CDN image URL for a catalog entity.
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
