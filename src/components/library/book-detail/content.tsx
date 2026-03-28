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

const DEFAULT_COPIES = 3

interface Props {
  bookId: string
  userId: string
  lang?: string
  dictionary?: Record<string, unknown>
}

export default async function LibraryBookDetailContent({
  bookId,
  userId,
  lang = "ar",
  dictionary,
}: Props) {
  const { schoolId } = await getTenantContext()
  const lib = (dictionary as Record<string, Record<string, unknown>>)
    ?.library as Record<string, string> | undefined

  if (!schoolId) {
    notFound()
  }

  // Load from global Book (works for all schools out of the box)
  const catalogBook = await db.book.findFirst({
    where: {
      id: bookId,
      status: "PUBLISHED",
      approvalStatus: "APPROVED",
    },
  })

  if (!catalogBook) {
    notFound()
  }

  // Check if school has hidden this book
  const hiddenSelection = await db.bookSelection.findUnique({
    where: { schoolId_catalogBookId: { schoolId, catalogBookId: bookId } },
    select: { isActive: true },
  })
  if (hiddenSelection && !hiddenSelection.isActive) {
    notFound()
  }

  // Find or lazily create school-scoped Book for borrowing
  let schoolBook = await db.schoolBook.findFirst({
    where: { schoolId, catalogBookId: bookId },
  })

  if (!schoolBook) {
    schoolBook = await db.schoolBook.create({
      data: {
        schoolId,
        catalogBookId: catalogBook.id,
        title: catalogBook.title,
        author: catalogBook.author,
        genre: catalogBook.genre,
        description: catalogBook.description ?? "",
        summary: catalogBook.summary ?? "",
        coverUrl: catalogBook.coverUrl ?? "",
        coverColor: catalogBook.coverColor,
        rating: Math.round(catalogBook.rating),
        totalCopies: DEFAULT_COPIES,
        availableCopies: DEFAULT_COPIES,
        videoUrl: catalogBook.videoUrl,
        isbn: catalogBook.isbn,
        publisher: catalogBook.publisher,
        publicationYear: catalogBook.publicationYear,
        language: catalogBook.language,
        pageCount: catalogBook.pageCount,
        gradeLevel: catalogBook.gradeLevel,
      },
    })
  }

  // Parallel queries: borrow record, borrow stats, related catalog books
  const [
    activeBorrowRecord,
    totalBorrows,
    activeBorrows,
    moreByAuthor,
    similarBooks,
  ] = await Promise.all([
    db.borrowRecord.findFirst({
      where: {
        bookId: schoolBook.id,
        userId,
        schoolId,
        status: "BORROWED",
      },
    }),
    db.borrowRecord.count({
      where: { bookId: schoolBook.id, schoolId },
    }),
    db.borrowRecord.count({
      where: { bookId: schoolBook.id, schoolId, status: "BORROWED" },
    }),
    db.book.findMany({
      where: {
        author: catalogBook.author,
        id: { not: bookId },
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: { in: ["PUBLIC", "SCHOOL"] },
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
    db.book.findMany({
      where: {
        genre: catalogBook.genre,
        id: { not: bookId },
        author: { not: catalogBook.author },
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: { in: ["PUBLIC", "SCHOOL"] },
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
    catalogBook.pageCount ||
    catalogBook.language ||
    catalogBook.publicationYear ||
    catalogBook.isbn ||
    catalogBook.publisher

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Hero: Cover + Info */}
      <div className="flex gap-8">
        <div className="shrink-0">
          <div
            className="aspect-[2/3] w-48 overflow-hidden rounded shadow-lg"
            style={{ backgroundColor: catalogBook.coverColor || "#1a1a2e" }}
          >
            <BookCover
              coverUrl={catalogBook.coverUrl}
              coverColor={catalogBook.coverColor}
              title={catalogBook.title}
              author={catalogBook.author}
              width={192}
              height={288}
              priority
              textSize="md"
            />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <h1 className="text-foreground text-2xl font-bold">
            {catalogBook.title}
          </h1>
          <p className="text-muted-foreground">
            {lib?.by || "by"} {catalogBook.author}
          </p>

          <StarRating rating={Math.round(catalogBook.rating)} />

          <div className="flex flex-wrap items-center gap-2">
            {catalogBook.gradeLevel && catalogBook.gradeLevel !== "GENERAL" && (
              <Badge variant="outline">{catalogBook.gradeLevel}</Badge>
            )}
            <Badge variant="secondary">{catalogBook.genre}</Badge>
          </div>

          <p
            className={`text-sm ${schoolBook.availableCopies > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {schoolBook.availableCopies} {lib?.of || "of"}{" "}
            {schoolBook.totalCopies}{" "}
            {lib?.copiesAvailable || "copies available"}
          </p>

          <div className="pt-2">
            <BorrowBook
              bookId={schoolBook.id}
              userId={userId}
              schoolId={schoolId}
              availableCopies={schoolBook.availableCopies}
              hasBorrowedBook={!!activeBorrowRecord}
              borrowRecordId={activeBorrowRecord?.id}
              dictionary={lib}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      {catalogBook.description && (
        <div>
          <h3 className="text-foreground mb-2 font-semibold">
            {lib?.description || "Description"}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {catalogBook.description}
          </p>
        </div>
      )}

      {/* Book Details Table */}
      {hasDetails && (
        <div>
          <h3 className="text-foreground mb-3 font-semibold">
            {lib?.bookDetails || "Book Details"}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {catalogBook.pageCount && (
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {lib?.pages || "Pages"}
                  </p>
                  <p className="text-foreground text-sm font-medium">
                    {catalogBook.pageCount}
                  </p>
                </div>
              </div>
            )}
            {catalogBook.language && (
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Globe className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {lib?.language || "Language"}
                  </p>
                  <p className="text-foreground text-sm font-medium">
                    {catalogBook.language}
                  </p>
                </div>
              </div>
            )}
            {catalogBook.publicationYear && (
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    {lib?.year || "Year"}
                  </p>
                  <p className="text-foreground text-sm font-medium">
                    {catalogBook.publicationYear}
                  </p>
                </div>
              </div>
            )}
            {catalogBook.isbn && (
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Hash className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">ISBN</p>
                  <p className="text-foreground text-sm font-medium">
                    {catalogBook.isbn}
                  </p>
                </div>
              </div>
            )}
          </div>
          {catalogBook.publisher && (
            <div className="bg-muted/50 mt-3 flex items-center gap-2 rounded-lg p-3">
              <Building2 className="text-muted-foreground size-4 shrink-0" />
              <p className="text-muted-foreground text-xs">
                {lib?.publisher || "Publisher"}:
              </p>
              <p className="text-foreground text-sm font-medium">
                {catalogBook.publisher}
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
      {catalogBook.summary && (
        <div>
          <h3 className="text-foreground mb-2 font-semibold">
            {lib?.summary || "Summary"}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {catalogBook.summary}
          </p>
        </div>
      )}

      {/* Video */}
      {catalogBook.videoUrl && (
        <div>
          <BookVideo
            videoUrl={catalogBook.videoUrl}
            title={catalogBook.title}
          />
        </div>
      )}

      {/* More by Author */}
      {moreByAuthor.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-foreground mb-4 font-semibold">
              {lib?.moreBy || "More by"} {catalogBook.author}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {moreByAuthor.map((related) => (
                <Link
                  key={related.id}
                  href={`/${lang}/library/books/${related.id}`}
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
                  href={`/${lang}/library/books/${related.id}`}
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
