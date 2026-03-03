"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Image from "next/image"

interface Props {
  coverUrl: string
  coverColor: string
  title: string
  author?: string
}

export default function BookCover({
  coverUrl,
  coverColor,
  title,
  author,
}: Props) {
  const [imageError, setImageError] = useState(false)

  const hasValidImage =
    coverUrl && !coverUrl.includes("placeholder") && !imageError

  // Fallback content for missing images
  const FallbackContent = () => (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h2 className="mb-4 line-clamp-4 text-3xl font-bold text-white">
        {title}
      </h2>
      {author && <p className="text-xl text-white/90">{author}</p>}
    </div>
  )

  return (
    <div className="book-cover-wrapper" style={{ backgroundColor: coverColor }}>
      {hasValidImage ? (
        <Image
          src={coverUrl}
          alt={title}
          width={400}
          height={600}
          className="book-cover-detail-image"
          priority
          unoptimized
          onError={() => setImageError(true)}
        />
      ) : (
        <FallbackContent />
      )}
    </div>
  )
}
