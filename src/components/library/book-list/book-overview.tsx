"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { BookCover } from "../book-cover"
import type { Book } from "../types"

interface Props {
  book: Book
  userId: string
}

export default function BookOverview({ book, userId }: Props) {
  const params = useParams()
  const locale = (params?.lang as string) || "ar"
  const { dictionary } = useDictionary()
  const libraryDict = dictionary?.library?.book

  return (
    <section className="flex flex-col items-center gap-8 md:flex-row">
      {/* Book Cover */}
      <div
        className="aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-lg"
        style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
      >
        <BookCover
          coverUrl={book.coverUrl}
          coverColor={book.coverColor}
          title={book.title}
          author={book.author}
          textSize="lg"
        />
      </div>

      {/* Book Info */}
      <div className="flex-1 space-y-4 text-center md:text-start">
        <h1 className="text-foreground max-w-md text-2xl leading-tight font-bold md:text-3xl">
          {book.title}
        </h1>

        <p className="text-muted-foreground">
          {libraryDict?.by || "By"} {book.author}
        </p>

        {/* Genre Badge */}
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
            {book.genre || "Fantasy"}
          </span>
        </div>

        <p className="text-muted-foreground line-clamp-3 max-w-xl text-sm leading-relaxed">
          {book.description}
        </p>

        {/* Review Stars */}
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-4 w-4 ${star <= (book.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="text-muted-foreground text-sm">
            {book.rating || 5}/5
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <Button asChild>
            <Link href={`/${locale}/library/books/${book.id}`}>
              {libraryDict?.viewDetails || "View Details"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
