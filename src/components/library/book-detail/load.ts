// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import { localize, localizeOne } from "@/components/translation/localize"
import type { Lang } from "@/components/translation/types"

import { BOOK_GRADE_LEVEL_LABELS, type BookGradeLevel } from "../config"

const DEFAULT_COPIES = 3

export interface BookDetailInput {
  bookId: string
  userId: string
  schoolId: string
  lang: string
  /** The school dictionary (`dictionary.school`); its `library` labels name the info rows. */
  dictionary?: Record<string, unknown>
}

/**
 * Everything `/library/books/[id]` shows, for the page and for the phone
 * (`/api/mobile/library/catalog/[id]`), so the two cannot drift: the catalog
 * book in the reader's language, the school's lending copy (created on first
 * open, as the page always has), the reader's loan, the Information rows, the
 * About paragraphs and the two shelves. `null` when the book is not in this
 * school's catalog.
 */
export async function loadBookDetail({
  bookId,
  userId,
  schoolId,
  lang,
  dictionary,
}: BookDetailInput) {
  const lib = (dictionary as Record<string, Record<string, unknown>>)
    ?.library as Record<string, string> | undefined

  // Load from global Book (works for all schools out of the box)
  const catalogBook = await db.book.findFirst({
    where: {
      id: bookId,
      status: "PUBLISHED",
      approvalStatus: "APPROVED",
    },
  })

  if (!catalogBook) return null

  // Check if school has hidden this book
  const hiddenSelection = await db.bookSelection.findUnique({
    where: { schoolId_catalogBookId: { schoolId, catalogBookId: bookId } },
    select: { isActive: true },
  })
  if (hiddenSelection && !hiddenSelection.isActive) return null

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

  // Everything the reader sees, put into the reader's language. The listing
  // has always done this and this page never did, so a book opened from an
  // Arabic shelf changed language on the way in.
  //
  // AFTER the queries above, never before: `moreByAuthor` matches on
  // `catalogBook.author` and `similarBooks` on `catalogBook.genre`, and a
  // translated author matches no row. Same trap as `FEATURED_BOOK_TITLE` on
  // the library home. `localize` leaves text alone when it is already in the
  // display language, so an Arabic-authored book costs nothing here.
  const displayLang = (lang || "ar") as Lang
  const [book, relatedByAuthor, relatedSimilar] = await Promise.all([
    localizeOne("Book", catalogBook, { schoolId, lang: displayLang }),
    localize("Book", moreByAuthor, { schoolId, lang: displayLang }),
    localize("Book", similarBooks, { schoolId, lang: displayLang }),
  ])
  const shown = book ?? catalogBook

  // The eyebrow's word. `BOOK_GRADE_LEVEL_LABELS` in `config.ts` is an
  // English-only constant, so it rendered "Elementary" on an otherwise fully
  // Arabic page — the one string on this hero that `localize()` cannot reach,
  // because it never comes from the database. It reads the dictionary first
  // and keeps the constant as the fallback for a level a locale has not named.
  const gradeLevels = (
    dictionary as
      | { library?: { gradeLevels?: Record<string, string> } }
      | undefined
  )?.library?.gradeLevels

  const gradeLabel =
    shown.gradeLevel && shown.gradeLevel !== "GENERAL"
      ? (gradeLevels?.[shown.gradeLevel] ??
        BOOK_GRADE_LEVEL_LABELS[shown.gradeLevel as BookGradeLevel] ??
        shown.gradeLevel)
      : null

  // The reference's Information list. Every row is dropped when its field is
  // empty, so a sparse catalog row shows a short list rather than a grid of
  // blanks. Borrowing counts join the same list — they are two more facts
  // about this book, and giving them a section of their own gave one sentence
  // the same weight as the description.
  const infoRows = [
    shown.publisher && {
      label: lib?.publisher || "Publisher",
      value: shown.publisher,
    },
    shown.language && {
      label: lib?.language || "Language",
      value: shown.language,
    },
    shown.pageCount && {
      label: lib?.pagesLabel || "Pages",
      value: String(shown.pageCount),
    },
    shown.publicationYear && {
      label: lib?.published || "Published",
      value: String(shown.publicationYear),
    },
    shown.isbn && { label: "ISBN", value: shown.isbn },
    // Moved off the hero card. The reference's card names the edition, not
    // the stock, so the count belongs with the other facts about this book —
    // and the borrow pill still says Unavailable on its own at zero.
    {
      label: lib?.availability || "Availability",
      value: `${schoolBook.availableCopies} ${lib?.of || "of"} ${schoolBook.totalCopies}`,
    },
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
  const aboutParagraphs = [shown.description, shown.summary].filter(
    (text): text is string => Boolean(text?.trim())
  )


  return {
    shown,
    gradeLabel,
    infoRows,
    aboutParagraphs,
    schoolBook,
    activeBorrowRecord,
    relatedByAuthor,
    relatedSimilar,
  }
}

export type BookDetail = NonNullable<Awaited<ReturnType<typeof loadBookDetail>>>
