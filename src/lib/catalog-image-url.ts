// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
  imageKey: string | null | undefined,
  size: CatalogImageSize = "original"
): string | null {
  // Priority 1: CDN thumbnail (S3/CloudFront)
  if (thumbnailKey && isCloudFrontConfigured()) {
    return getCloudFrontUrl(`${thumbnailKey}-${size}.webp`)
  }

  // Priority 2: imageKey — S3 catalog path or external URL
  if (imageKey) {
    if (imageKey.startsWith("catalog/") && isCloudFrontConfigured()) {
      return getCloudFrontUrl(imageKey)
    }
    return imageKey
  }

  return null
}

/**
 * Resolve a catalog image by concept name.
 * Concept-based images are shared across curricula (e.g., "math" image
 * used by us-k12 Math, national Math, etc.)
 */
export function getCatalogConceptImageUrl(
  level: "subject" | "chapter" | "lesson",
  imageKey: string | null | undefined,
  concept: string | null | undefined,
  size: CatalogImageSize = "sm"
): string | null {
  // Direct imageKey takes priority
  if (imageKey) {
    if (imageKey.startsWith("catalog/") && isCloudFrontConfigured()) {
      return getCloudFrontUrl(imageKey)
    }
    if (imageKey.startsWith("http")) return imageKey
    return imageKey
  }

  // Concept-based lookup from S3
  if (concept && isCloudFrontConfigured()) {
    return getCloudFrontUrl(`catalog/${level}s/${concept}-${size}.webp`)
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
