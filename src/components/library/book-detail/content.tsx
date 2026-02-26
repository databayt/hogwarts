// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"
import {
  BookOpen,
  Building2,
  Calendar,
  FileText,
  Globe,
  Hash,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { BookCover } from "../book-cover"
import BookVideo from "./book-video"
import BorrowBook from "./borrow-book"
import { StarRating } from "./star-rating"

interface Props {
  bookId: string
  userId: string
  dictionary?: Record<string, unknown>
}

export default async function LibraryBookDetailContent({
  bookId,
  userId,
  dictionary,
}: Props) {
  const { schoolId } = await getTenantContext()
  const lib = (dictionary as Record<string, Record<string, unknown>>)
    ?.library as Record<string, string> | undefined

  if (!schoolId) {
    notFound()
  }

  const book = await db.book.findFirst({
    where: { id: bookId, schoolId },
  })

  if (!book) {
    notFound()
  }

  // Parallel queries: borrow record, borrow stats, related books
  const [
    activeBorrowRecord,
    totalBorrows,
    activeBorrows,
    moreByAuthor,
    similarBooks,
  ] = await Promise.all([
    db.borrowRecord.findFirst({
      where: { bookId: book.id, userId, schoolId, status: "BORROWED" },
    }),
    db.borrowRecord.count({ where: { bookId: book.id, schoolId } }),
    db.borrowRecord.count({
      where: { bookId: book.id, schoolId, status: "BORROWED" },
    }),
    db.book.findMany({
      where: { schoolId, author: book.author, id: { not: bookId } },
      take: 8,
      select: {
        id: true,
        title: true,
        coverUrl: true,
        coverColor: true,
        author: true,
        rating: true,
      },
    }),
    db.book.findMany({
      where: {
        schoolId,
        genre: book.genre,
        id: { not: bookId },
        author: { not: book.author },
      },
      take: 8,
      select: {
        id: true,
        title: true,
        coverUrl: true,
        coverColor: true,
        author: true,
        rating: true,
      },
    }),
  ])

  const hasDetails =
    book.pageCount ||
    book.language ||
    book.publicationYear ||
    book.isbn ||
    book.publisher

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Hero: Cover + Info */}
      <div className="flex gap-8">
        <div className="shrink-0">
          <div
            className="aspect-[2/3] w-48 overflow-hidden rounded shadow-lg"
            style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
          >
            <BookCover
              coverUrl={book.coverUrl}
              coverColor={book.coverColor}
              title={book.title}
              author={book.author}
              width={192}
              height={288}
              priority
              textSize="md"
            />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <h1 className="text-foreground text-2xl font-bold">{book.title}</h1>
          <p className="text-muted-foreground">
            {lib?.by || "by"} {book.author}
          </p>

          <StarRating rating={book.rating} />

          <div className="flex flex-wrap items-center gap-2">
            {book.gradeLevel && book.gradeLevel !== "GENERAL" && (
              <Badge variant="outline">{book.gradeLevel}</Badge>
            )}
            <Badge variant="secondary">{book.genre}</Badge>
          </div>

          <p
            className={`text-sm ${book.availableCopies > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {book.availableCopies} {lib?.of || "of"} {book.totalCopies}{" "}
            {lib?.copiesAvailable || "copies available"}
          </p>

          <div className="pt-2">
            <BorrowBook
              bookId={book.id}
              userId={userId}
              schoolId={schoolId}
              availableCopies={book.availableCopies}
              hasBorrowedBook={!!activeBorrowRecord}
              borrowRecordId={activeBorrowRecord?.id}
              dictionary={lib}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-foreground mb-2 font-semibold">
          {lib?.description || "Description"}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {book.description}
        </p>
      </div>

      {/* Book Details Table */}
      {hasDetails && (
        <div>
          <h3 className="text-foreground mb-3 font-semibold">
            {lib?.bookDetails || "Book Details"}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {book.pageCount && (
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {lib?.pages || "Pages"}
                  </p>
                  <p className="text-foreground text-sm font-medium">
                    {book.pageCount}
                  </p>
                </div>
              </div>
            )}
            {book.language && (
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Globe className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {lib?.language || "Language"}
                  </p>
                  <p className="text-foreground text-sm font-medium">
                    {book.language}
                  </p>
                </div>
              </div>
            )}
            {book.publicationYear && (
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {lib?.year || "Year"}
                  </p>
                  <p className="text-foreground text-sm font-medium">
                    {book.publicationYear}
                  </p>
                </div>
              </div>
            )}
            {book.isbn && (
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Hash className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">ISBN</p>
                  <p className="text-foreground text-sm font-medium">
                    {book.isbn}
                  </p>
                </div>
              </div>
            )}
          </div>
          {book.publisher && (
            <div className="bg-muted/50 mt-3 flex items-center gap-2 rounded-lg p-3">
              <Building2 className="text-muted-foreground size-4 shrink-0" />
              <p className="text-muted-foreground text-xs">
                {lib?.publisher || "Publisher"}:
              </p>
              <p className="text-foreground text-sm font-medium">
                {book.publisher}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Borrowing Activity */}
      {totalBorrows > 0 && (
        <div>
          <h3 className="text-foreground mb-2 font-semibold">
            {lib?.borrowingActivity || "Borrowing Activity"}
          </h3>
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-4">
            <BookOpen className="text-muted-foreground size-5" />
            <p className="text-muted-foreground text-sm">
              {totalBorrows} {lib?.timesBorrowed || "times borrowed"} &middot;{" "}
              {activeBorrows} {lib?.currentlyOut || "currently out"}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      {book.summary && (
        <div>
          <h3 className="text-foreground mb-2 font-semibold">
            {lib?.summary || "Summary"}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {book.summary}
          </p>
        </div>
      )}

      {/* Video */}
      {book.videoUrl && (
        <div>
          <BookVideo videoUrl={book.videoUrl} title={book.title} />
        </div>
      )}

      {/* More by Author */}
      {moreByAuthor.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-foreground mb-4 font-semibold">
              {lib?.moreBy || "More by"} {book.author}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {moreByAuthor.map((related) => (
                <Link
                  key={related.id}
                  href={`library/books/${related.id}`}
                  className="group"
                >
                  <div
                    className="aspect-[2/3] overflow-hidden rounded shadow-sm transition-shadow group-hover:shadow-md"
                    style={{
                      backgroundColor: related.coverColor || "#1a1a2e",
                    }}
                  >
                    <BookCover
                      coverUrl={related.coverUrl}
                      coverColor={related.coverColor}
                      title={related.title}
                      author={related.author}
                      width={120}
                      height={180}
                      textSize="sm"
                    />
                  </div>
                  <p className="text-foreground mt-2 line-clamp-2 text-xs font-medium">
                    {related.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Similar Books */}
      {similarBooks.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-foreground mb-4 font-semibold">
              {lib?.similarBooks || "Similar Books"}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {similarBooks.map((related) => (
                <Link
                  key={related.id}
                  href={`library/books/${related.id}`}
                  className="group"
                >
                  <div
                    className="aspect-[2/3] overflow-hidden rounded shadow-sm transition-shadow group-hover:shadow-md"
                    style={{
                      backgroundColor: related.coverColor || "#1a1a2e",
                    }}
                  >
                    <BookCover
                      coverUrl={related.coverUrl}
                      coverColor={related.coverColor}
                      title={related.title}
                      author={related.author}
                      width={120}
                      height={180}
                      textSize="sm"
                    />
                  </div>
                  <p className="text-foreground mt-2 line-clamp-2 text-xs font-medium">
                    {related.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
