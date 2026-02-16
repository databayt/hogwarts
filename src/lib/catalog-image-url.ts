/**
 * Client-safe catalog image URL helpers.
 *
 * Extracted from catalog-image.ts to avoid pulling sharp/S3 into the client bundle.
 */

import { getCloudFrontUrl } from "@/lib/cloudfront"

export type CatalogImageSize = "sm" | "md" | "lg" | "original"

/**
 * Resolve the best available image URL for a catalog entity.
 * Priority: thumbnailKey CDN → imageKey static PNG → null
 */
export function getCatalogImageUrl(
  thumbnailKey: string | null | undefined,
  imageKey: string | null | undefined,
  size: CatalogImageSize = "original"
): string | null {
  if (thumbnailKey) {
    return getCloudFrontUrl(`${thumbnailKey}-${size}.webp`)
  }

  if (imageKey) {
    if (imageKey.startsWith("/")) return imageKey
    return `/subjects/${imageKey}.png`
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
  if (!thumbnailKey) return undefined

  return [
    `${getCloudFrontUrl(`${thumbnailKey}-sm.webp`)} 200w`,
    `${getCloudFrontUrl(`${thumbnailKey}-md.webp`)} 600w`,
    `${getCloudFrontUrl(`${thumbnailKey}-lg.webp`)} 1200w`,
    `${getCloudFrontUrl(`${thumbnailKey}-original.webp`)} 3840w`,
  ].join(", ")
}
