// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Client-safe catalog image URL helpers.
 *
 * Extracted from image.ts to avoid pulling sharp/S3 into the client bundle.
 */

import { getCloudFrontUrl, isCloudFrontConfigured } from "@/lib/cloudfront-url"

export type CatalogImageSize = "sm" | "md" | "lg" | "original"

/** A stored key that already carries an image extension is a single file (the flat
 *  `clickview/...` art) — served as-is. A bare prefix gets the `-size.webp` variant
 *  suffix (the legacy `catalog/concepts/...` pipeline). */
const HAS_IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i

/**
 * Resolve the CDN image URL for a catalog entity.
 * Returns a CloudFront URL for the given S3 key, or null if unavailable.
 */
export function getCatalogImageUrl(
  thumbnail: string | null | undefined,
  size: CatalogImageSize = "original"
): string | null {
  if (!thumbnail || !isCloudFrontConfigured()) return null
  if (HAS_IMAGE_EXT.test(thumbnail)) return getCloudFrontUrl(thumbnail)
  return getCloudFrontUrl(`${thumbnail}-${size}.webp`)
}

/**
 * Build a srcSet string for responsive loading.
 * Only works with CDN thumbnails (not static fallbacks).
 */
export function getCatalogImageSrcSet(
  thumbnail: string | null | undefined
): string | undefined {
  if (!thumbnail || !isCloudFrontConfigured()) return undefined
  // Single-file keys (clickview/...) have no responsive variants.
  if (HAS_IMAGE_EXT.test(thumbnail)) return undefined

  return [
    `${getCloudFrontUrl(`${thumbnail}-sm.webp`)} 200w`,
    `${getCloudFrontUrl(`${thumbnail}-md.webp`)} 600w`,
    `${getCloudFrontUrl(`${thumbnail}-lg.webp`)} 1200w`,
    `${getCloudFrontUrl(`${thumbnail}-original.webp`)} 3840w`,
  ].join(", ")
}
