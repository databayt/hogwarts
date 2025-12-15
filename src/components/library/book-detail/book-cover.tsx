"use client"

import { useMemo, useState } from "react"
import Image from "next/image"

import { BookCoverImage } from "@/components/ui/imagekit-image"

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

  // Check if it's an ImageKit URL
  const isImageKitUrl = useMemo(() => {
    if (!coverUrl) return false
    return (
      coverUrl.includes("ik.imagekit.io") || coverUrl.startsWith("hogwarts/")
    )
  }, [coverUrl])

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
        isImageKitUrl ? (
          <BookCoverImage
            src={coverUrl}
            alt={title}
            width={400}
            height={600}
            preset="detail"
            priority
            className="book-cover-detail-image"
            onError={() => setImageError(true)}
            fallback={<FallbackContent />}
          />
        ) : (
          <Image
            src={coverUrl}
            alt={title}
            width={400}
            height={600}
            className="book-cover-detail-image"
            priority
            onError={() => setImageError(true)}
          />
        )
      ) : (
        <FallbackContent />
      )}
    </div>
  )
}
