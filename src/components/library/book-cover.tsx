"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Image from "next/image"

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
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false)

  const textSizeClasses = {
    sm: { title: "text-sm", author: "text-xs" },
    md: { title: "text-base", author: "text-sm" },
    lg: { title: "text-lg", author: "text-sm" },
  }

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

  return (
    <Image
      src={coverUrl}
      alt={title}
      width={width}
      height={height}
      className={`h-full w-full object-cover ${className}`}
      priority={priority}
      unoptimized
      onError={() => setImageError(true)}
    />
  )
}
