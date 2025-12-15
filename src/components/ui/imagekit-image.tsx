/**
 * ImageKit Image Component
 *
 * Optimized image component using ImageKit CDN transformations.
 * Wraps Next.js Image with automatic URL transformations,
 * responsive srcset generation, and blur placeholder support.
 */

"use client"

import { useMemo } from "react"
import Image, { type ImageProps } from "next/image"

import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

export interface ImageKitTransformations {
  /** Width in pixels */
  width?: number
  /** Height in pixels */
  height?: number
  /** Quality (1-100, default: 80) */
  quality?: number
  /** Crop mode */
  crop?: "maintain_ratio" | "force" | "at_least" | "at_max"
  /** Focus area for cropping */
  focus?: "center" | "top" | "left" | "bottom" | "right" | "auto"
  /** Output format */
  format?: "auto" | "webp" | "jpg" | "png" | "avif"
  /** Blur amount (1-100) */
  blur?: number
}

export interface ImageKitImageProps extends Omit<ImageProps, "src" | "loader"> {
  /** ImageKit URL or path */
  src: string
  /** Transformation options */
  transformations?: ImageKitTransformations
  /** Fallback element when image fails to load */
  fallback?: React.ReactNode
}

// ============================================================================
// Constants
// ============================================================================

const IMAGEKIT_URL_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
  "https://ik.imagekit.io/abdout"

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build transformation string from options
 */
function buildTransformationString(opts: ImageKitTransformations): string {
  const parts: string[] = []

  if (opts.width) parts.push(`w-${opts.width}`)
  if (opts.height) parts.push(`h-${opts.height}`)
  if (opts.quality) parts.push(`q-${opts.quality}`)
  if (opts.crop) parts.push(`c-${opts.crop}`)
  if (opts.focus) parts.push(`fo-${opts.focus}`)
  if (opts.format) parts.push(`f-${opts.format}`)
  if (opts.blur) parts.push(`bl-${opts.blur}`)

  return parts.join(",")
}

/**
 * Get the base path from an ImageKit URL
 */
function getBasePath(src: string): string {
  if (src.startsWith(IMAGEKIT_URL_ENDPOINT)) {
    // Remove endpoint and any existing transformations
    let path = src.replace(IMAGEKIT_URL_ENDPOINT, "")
    // Remove query params (transformations)
    if (path.includes("?")) {
      path = path.split("?")[0]
    }
    return path
  }

  if (src.startsWith("https://ik.imagekit.io/")) {
    // Extract path from any ImageKit URL
    const url = new URL(src)
    return url.pathname.replace(/^\/[^/]+/, "") // Remove account name
  }

  // Assume it's already a path
  return src.startsWith("/") ? src : `/${src}`
}

/**
 * Build full ImageKit URL with transformations
 */
function buildImageKitUrl(
  src: string,
  transformations?: ImageKitTransformations,
  width?: number
): string {
  const basePath = getBasePath(src)
  const tr = transformations || {}

  // Use width from Next.js loader if not specified in transformations
  if (width && !tr.width) {
    tr.width = width
  }

  // Default quality if not specified
  if (!tr.quality) {
    tr.quality = 80
  }

  // Default format to auto (WebP/AVIF based on browser)
  if (!tr.format) {
    tr.format = "auto"
  }

  const trString = buildTransformationString(tr)

  if (trString) {
    return `${IMAGEKIT_URL_ENDPOINT}${basePath}?tr=${trString}`
  }

  return `${IMAGEKIT_URL_ENDPOINT}${basePath}`
}

// ============================================================================
// Custom Loader for Next.js Image
// ============================================================================

interface LoaderProps {
  src: string
  width: number
  quality?: number
}

function createImageKitLoader(transformations?: ImageKitTransformations) {
  return function imageKitLoader({ src, width, quality }: LoaderProps): string {
    const tr: ImageKitTransformations = {
      ...transformations,
      width,
      quality: quality || transformations?.quality || 80,
    }
    return buildImageKitUrl(src, tr)
  }
}

// ============================================================================
// Component
// ============================================================================

export function ImageKitImage({
  src,
  transformations,
  fallback,
  className,
  alt,
  onError,
  ...props
}: ImageKitImageProps) {
  // Create loader with transformations
  const loader = useMemo(
    () => createImageKitLoader(transformations),
    [transformations]
  )

  // Check if src is a valid ImageKit URL or path
  const isValidSrc = useMemo(() => {
    if (!src) return false
    return (
      src.startsWith(IMAGEKIT_URL_ENDPOINT) ||
      src.startsWith("https://ik.imagekit.io/") ||
      src.startsWith("/hogwarts/") ||
      src.startsWith("hogwarts/")
    )
  }, [src])

  // Handle invalid or missing src
  if (!isValidSrc) {
    if (fallback) {
      return <>{fallback}</>
    }
    // Return a placeholder with the alt text
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex items-center justify-center",
          className
        )}
        role="img"
        aria-label={alt}
      >
        {alt?.charAt(0) || "?"}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      loader={loader}
      className={className}
      onError={(e) => {
        // Handle error - could swap to fallback
        onError?.(e)
      }}
      {...props}
    />
  )
}

// ============================================================================
// Preset Components
// ============================================================================

export interface BookCoverImageProps extends Omit<
  ImageKitImageProps,
  "transformations"
> {
  /** Preset size */
  preset?: "thumbnail" | "card" | "detail" | "original"
}

const BOOK_COVER_PRESETS: Record<string, ImageKitTransformations> = {
  thumbnail: { width: 200, height: 267, quality: 75, crop: "maintain_ratio" },
  card: { width: 300, height: 400, quality: 80, crop: "maintain_ratio" },
  detail: { width: 600, height: 800, quality: 90, crop: "maintain_ratio" },
  original: { quality: 100 },
}

/**
 * Book Cover Image with preset transformations
 */
export function BookCoverImage({
  preset = "card",
  ...props
}: BookCoverImageProps) {
  return (
    <ImageKitImage transformations={BOOK_COVER_PRESETS[preset]} {...props} />
  )
}

// ============================================================================
// Export helpers
// ============================================================================

export { buildImageKitUrl, getBasePath }
