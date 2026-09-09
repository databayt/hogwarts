// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { BookJacket } from "../book-jacket"

interface ShelfBook {
  id: string
  title: string
  author: string
  coverUrl: string | null
  coverColor: string | null
}

interface Props {
  heading: string
  books: ShelfBook[]
  lang: string
}

/**
 * One horizontally-scrolling row of covers, the way the reference ends its
 * page — a heading with a chevron, then covers that run off the edge so the
 * cut-off one says there is more.
 *
 * The scroller matches `lumos/courses/course-shelf.tsx` so the two read as one
 * system. Nothing here is direction-aware: `overflow-x-auto` follows the
 * document's `dir`, so an Arabic reader scrolls from the right with no
 * transform. The chevron is the one exception, and it mirrors.
 */
export function BookShelf({ heading, books, lang }: Props) {
  if (books.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-1 text-xl font-bold">
        {heading}
        <ChevronRight className="text-muted-foreground size-5 rtl:rotate-180" />
      </h2>

      <div className="no-scrollbar -mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/${lang}/library/books/${book.id}`}
            className="group w-28 shrink-0 sm:w-32"
          >
            <BookJacket
              coverUrl={book.coverUrl}
              coverColor={book.coverColor}
              title={book.title}
              author={book.author}
              width={128}
              height={192}
              textSize="sm"
              className="aspect-[2/3] shadow-md transition-shadow group-hover:shadow-lg"
            />
            <p className="mt-2 line-clamp-2 text-sm font-medium">
              {book.title}
            </p>
            <p className="text-muted-foreground line-clamp-1 text-xs">
              {book.author}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
