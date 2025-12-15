"use client"

import { useMemo, useState } from "react"
import Image from "next/image"

import { BookCoverImage } from "@/components/ui/imagekit-image"

// ============================================================================
// Types
// ============================================================================

interface BookCoverProps {
  coverUrl?: string | null
  coverColor?: string | null
  title: string
  author: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  textSize?: "sm" | "md" | "lg"
  /** Use ImageKit transformations for optimization */
  useImageKit?: boolean
  /** ImageKit preset (thumbnail, card, detail, original) */
  preset?: "thumbnail" | "card" | "detail" | "original"
}

// ============================================================================
// Component
// ============================================================================

export function BookCover({
  coverUrl,
  coverColor,
  title,
  author,
  width = 200,
  height = 300,
  priority = false,
  className = "",
  textSize = "md",
  useImageKit = true,
  preset = "card",
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false)

  const textSizeClasses = {
    sm: { title: "text-sm", author: "text-xs" },
    md: { title: "text-base", author: "text-sm" },
    lg: { title: "text-lg", author: "text-sm" },
  }

  // Check if the URL is from ImageKit
  const isImageKitUrl = useMemo(() => {
    if (!coverUrl) return false
    return (
      coverUrl.includes("ik.imagekit.io") || coverUrl.startsWith("hogwarts/")
    )
  }, [coverUrl])

  // Fallback content when no image or error
  const FallbackContent = () => (
    <div className="flex h-full flex-col items-center justify-center p-4 text-center">
      <p
        className={`line-clamp-3 font-bold text-white ${textSizeClasses[textSize].title}`}
      >
        {title}
      </p>
      <p className={`mt-1 text-white/70 ${textSizeClasses[textSize].author}`}>
        {author}
      </p>
    </div>
  )

  // Show fallback if no URL or image error
  if (!coverUrl || imageError) {
    return <FallbackContent />
  }

  // Use ImageKit component for ImageKit URLs when enabled
  if (useImageKit && isImageKitUrl) {
    return (
      <BookCoverImage
        src={coverUrl}
        alt={title}
        width={width}
        height={height}
        preset={preset}
        priority={priority}
        className={`h-full w-full object-cover ${className}`}
        onError={() => setImageError(true)}
        fallback={<FallbackContent />}
      />
    )
  }

  // Fallback to regular Image for non-ImageKit URLs
  return (
    <Image
      src={coverUrl}
      alt={title}
      width={width}
      height={height}
      className={`h-full w-full object-cover ${className}`}
      priority={priority}
      onError={() => setImageError(true)}
    />
  )
}
