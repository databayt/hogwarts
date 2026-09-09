// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { BOOK_GRADE_LEVEL_LABELS, type BookGradeLevel } from "../config"
import { BookAbout } from "./about"
import { BookShelf } from "./book-shelf"
import BookVideo from "./book-video"
import { BookHero } from "./hero"
import { BookInfoList } from "./info-list"

const DEFAULT_COPIES = 3

interface Props {
  bookId: string
  userId: string
  lang?: string
  dictionary?: Record<string, unknown>
}

/**
 * A book, read the way Apple Books reads one.
 *
 * The page is in two halves. The top is the book's own colour, edge to edge,
 * holding the cover and everything that identifies it, ending in the card that
 * borrows it. Below that the page turns to the ordinary ground and becomes
 * text: what the book is about, its facts as a list, then shelves of what to
 * read next.
 *
 * The old layout put a 192px cover beside a column of badges inside a
 * `max-w-2xl` box, with five headed sections stacked under it in the same
 * weight — the summary reading as loud as the title. Splitting it in two gives
 * the top half one job and lets the bottom half be quiet.
 */
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

  const gradeLabel =
    catalogBook.gradeLevel && catalogBook.gradeLevel !== "GENERAL"
      ? (BOOK_GRADE_LEVEL_LABELS[catalogBook.gradeLevel as BookGradeLevel] ??
        catalogBook.gradeLevel)
      : null

  // The reference's Information list. Every row is dropped when its field is
  // empty, so a sparse catalog row shows a short list rather than a grid of
  // blanks. Borrowing counts join the same list — they are two more facts
  // about this book, and giving them a section of their own gave one sentence
  // the same weight as the description.
  const infoRows = [
    catalogBook.publisher && {
      label: lib?.publisher || "Publisher",
      value: catalogBook.publisher,
    },
    catalogBook.language && {
      label: lib?.language || "Language",
      value: catalogBook.language,
    },
    catalogBook.pageCount && {
      label: lib?.pagesLabel || "Pages",
      value: String(catalogBook.pageCount),
    },
    catalogBook.publicationYear && {
      label: lib?.published || "Published",
      value: String(catalogBook.publicationYear),
    },
    catalogBook.isbn && { label: "ISBN", value: catalogBook.isbn },
    totalBorrows > 0 && {
      label: lib?.timesBorrowed || "Times borrowed",
      value: String(totalBorrows),
    },
    totalBorrows > 0 && {
      label: lib?.currentlyOut || "Currently out",
      value: String(activeBorrows),
    },
  ].filter(Boolean) as { label: string; value: string }[]

  // Description and summary are one block, not two headed sections a screen
  // apart: the reference runs the short edition note straight into the long
  // blurb under a single heading, and both of ours are prose about the book.
  const aboutParagraphs = [catalogBook.description, catalogBook.summary].filter(
    (text): text is string => Boolean(text?.trim())
  )

  return (
    // `data-immersive` — read by the school-dashboard layout, which unpins the
    // header and lets the container stop clipping so the hero can reach the
    // page edges. On the page ROOT rather than on the hero, matching the lumos
    // lesson: the colour owns the top of the screen and the bar comes back on
    // the way up.
    <div data-immersive className="pt-2 pb-10">
      <BookHero
        title={catalogBook.title}
        author={catalogBook.author}
        genre={catalogBook.genre}
        rating={catalogBook.rating}
        coverUrl={catalogBook.coverUrl}
        coverColor={catalogBook.coverColor}
        gradeLabel={gradeLabel}
        gradeLevel={catalogBook.gradeLevel}
        lang={lang}
        publicationYear={catalogBook.publicationYear}
        pageCount={catalogBook.pageCount}
        availableCopies={schoolBook.availableCopies}
        totalCopies={schoolBook.totalCopies}
        schoolBookId={schoolBook.id}
        userId={userId}
        schoolId={schoolId}
        hasBorrowedBook={!!activeBorrowRecord}
        borrowRecordId={activeBorrowRecord?.id}
        dictionary={lib}
      />

      {/* Below the colour the page is ordinary again — one narrow column, each
          section divided from the next by a rule rather than by a gap. */}
      <div className="mx-auto max-w-xl px-6 pt-8 [&>*+*]:mt-8 [&>*+*]:border-t [&>*+*]:pt-8">
        {aboutParagraphs.length > 0 && (
          <BookAbout
            heading={lib?.aboutThisBook || "About This Book"}
            paragraphs={aboutParagraphs}
            moreLabel={lib?.more || "More"}
            lessLabel={lib?.less || "Less"}
          />
        )}

        <BookInfoList
          heading={lib?.information || "Information"}
          rows={infoRows}
        />

        {catalogBook.videoUrl && (
          <section>
            <BookVideo
              videoUrl={catalogBook.videoUrl}
              title={catalogBook.title}
            />
          </section>
        )}

        <BookShelf
          heading={`${lib?.moreBy || "More by"} ${catalogBook.author}`}
          books={moreByAuthor}
          lang={lang}
        />

        <BookShelf
          heading={lib?.similarBooks || "You Might Also Like"}
          books={similarBooks}
          lang={lang}
        />
      </div>
    </div>
  )
}
