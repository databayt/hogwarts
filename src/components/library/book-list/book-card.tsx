"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"

import { BookCoverImage } from "@/components/ui/imagekit-image"

import type { Book } from "../types"

interface Props {
  book: Book
}

export default function BookCard({ book }: Props) {
  const { lang } = useParams()
  const [imageError, setImageError] = useState(false)

  // Check if it's a valid ImageKit URL
  const isImageKitUrl = useMemo(() => {
    if (!book.coverUrl) return false
    return (
      book.coverUrl.includes("ik.imagekit.io") ||
      book.coverUrl.startsWith("hogwarts/")
    )
  }, [book.coverUrl])

  const hasValidImage =
    book.coverUrl && !book.coverUrl.includes("placeholder") && !imageError

  // Fallback content for missing images
  const FallbackContent = () => (
    <div className="flex h-full flex-col items-center justify-center p-4 text-center">
      <h3 className="mb-2 line-clamp-3 text-lg font-bold text-white">
        {book.title}
      </h3>
      <p className="text-sm text-white/80">{book.author}</p>
    </div>
  )

  return (
    <li className="list-none">
      <Link
        href={`/${lang}/library/books/${book.id}`}
        className="block overflow-hidden rounded-lg transition-shadow hover:shadow-lg"
      >
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-lg"
          style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
        >
          {hasValidImage ? (
            isImageKitUrl ? (
              <BookCoverImage
                src={book.coverUrl}
                alt={book.title}
                fill
                preset="card"
                className="object-cover"
                onError={() => setImageError(true)}
                fallback={<FallbackContent />}
              />
            ) : (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            )
          ) : (
            <FallbackContent />
          )}
        </div>
      </Link>
    </li>
  )
}
