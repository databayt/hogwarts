"use client"

import Image from "next/image"

import {
  getCatalogImageSrcSet,
  getCatalogImageUrl,
  type CatalogImageSize,
} from "@/lib/catalog-image-url"
import { cn } from "@/lib/utils"

interface CatalogImageProps {
  thumbnailKey?: string | null
  imageKey?: string | null
  size?: CatalogImageSize
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

const SIZE_DIMENSIONS: Record<
  CatalogImageSize,
  { width: number; height: number }
> = {
  sm: { width: 200, height: 200 },
  md: { width: 600, height: 600 },
  lg: { width: 1200, height: 1200 },
  original: { width: 1200, height: 1200 },
}

export function CatalogImage({
  thumbnailKey,
  imageKey,
  size = "original",
  alt,
  width,
  height,
  className,
  priority = false,
}: CatalogImageProps) {
  const src = getCatalogImageUrl(thumbnailKey, imageKey, size)
  const srcSet = getCatalogImageSrcSet(thumbnailKey)
  const dimensions = SIZE_DIMENSIONS[size]

  if (!src) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center rounded-md",
          className
        )}
        style={{
          width: width ?? dimensions.width,
          height: height ?? dimensions.height,
        }}
      >
        <span className="text-muted-foreground text-xs">No image</span>
      </div>
    )
  }

  // CDN images (thumbnailKey) are external URLs
  if (thumbnailKey) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        srcSet={srcSet}
        sizes="(max-width: 640px) 200px, (max-width: 1024px) 600px, 1200px"
        alt={alt}
        width={width ?? dimensions.width}
        height={height ?? dimensions.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("object-cover", className)}
      />
    )
  }

  // Static images use Next.js Image for optimization
  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? dimensions.width}
      height={height ?? dimensions.height}
      priority={priority}
      quality={100}
      className={cn("object-cover", className)}
    />
  )
}
