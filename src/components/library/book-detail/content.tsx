import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { BookCover } from "../book-cover"
import BookVideo from "./book-video"
import BorrowBook from "./borrow-book"

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
    where: {
      id: bookId,
      schoolId,
    },
  })

  if (!book) {
    notFound()
  }

  // Check if user has active borrow record for this book
  const activeBorrowRecord = await db.borrowRecord.findFirst({
    where: {
      bookId: book.id,
      userId,
      schoolId,
      status: "BORROWED",
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Book Cover - Centered on top */}
      <div className="flex justify-center">
        <div
          className="aspect-[2/3] w-48 overflow-hidden rounded-lg shadow-lg"
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

      {/* Book Info */}
      <div className="space-y-3 text-center">
        <h1 className="text-foreground text-2xl font-bold">{book.title}</h1>
        <p className="text-muted-foreground">
          {lib?.by || "by"} {book.author}
        </p>

        <div className="flex items-center justify-center gap-3">
          <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm">
            {book.genre}
          </span>
          <span className="text-sm text-amber-500">⭐ {book.rating}/5</span>
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

      {/* Description */}
      <div>
        <h3 className="text-foreground mb-2 font-semibold">
          {lib?.description || "Description"}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {book.description}
        </p>
      </div>

      {/* More Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground">
            {lib?.totalCopies || "Total Copies"}
          </p>
          <p className="text-foreground font-semibold">{book.totalCopies}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground">
            {lib?.available || "Available"}
          </p>
          <p className="text-foreground font-semibold">
            {book.availableCopies}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground">{lib?.genre || "Genre"}</p>
          <p className="text-foreground font-semibold">{book.genre}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground">{lib?.rating || "Rating"}</p>
          <p className="text-foreground font-semibold">{book.rating}/5</p>
        </div>
      </div>

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
    </div>
  )
}
