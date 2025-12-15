"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { BookCover } from "../book-cover"
import type { Book } from "../types"

interface Props {
  title: string
  books: Book[]
  containerClassName?: string
  showViewAll?: boolean
}

export default function BookList({
  title,
  books,
  containerClassName,
  showViewAll = false,
}: Props) {
  const params = useParams()
  const locale = (params?.lang as string) || "ar"
  const { dictionary } = useDictionary()

  if (books.length < 1) return null

  return (
    <section className={containerClassName}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-foreground text-2xl font-bold">{title}</h2>
        {showViewAll && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/library/books`}>
              {dictionary?.library?.filters?.all || "All Books"}
            </Link>
          </Button>
        )}
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/${locale}/library/books/${book.id}`}
            className="w-32 flex-shrink-0 snap-start sm:w-36 md:w-40"
          >
            <div
              className="aspect-[2/3] overflow-hidden rounded-md"
              style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
            >
              <BookCover
                coverUrl={book.coverUrl}
                coverColor={book.coverColor}
                title={book.title}
                author={book.author}
                textSize="sm"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
