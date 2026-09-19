// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { BorrowRecord, SchoolBook } from "@prisma/client"

/**
 * The library's mobile projections.
 *
 * `SchoolBook` carries more than a phone list needs (summary, video, rating,
 * publisher) and less than the Android DTO once asked for: there is no shelf
 * and no section in the schema, and inventing either would put a made-up
 * location on a real book. Both are sent as empty strings, which the app reads
 * as "not recorded" and hides.
 */
export const BOOK_SELECT = {
  id: true,
  title: true,
  author: true,
  genre: true,
  description: true,
  coverUrl: true,
  coverColor: true,
  availableCopies: true,
  totalCopies: true,
  isbn: true,
  gradeLevel: true,
  publisher: true,
  publicationYear: true,
  language: true,
  pageCount: true,
  rating: true,
  createdAt: true,
} as const

type BookRow = Pick<SchoolBook, keyof typeof BOOK_SELECT & keyof SchoolBook>

export function toBookDto(book: BookRow) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? "",
    // `genre` is the school's own word for the shelf — "Poetry", "شعر
    // الجاهلية" — not a fixed enum. The app keeps the string and falls back to
    // "other" when it does not recognise it.
    category: book.genre,
    description: book.description,
    cover_image_url: book.coverUrl || null,
    cover_color: book.coverColor,
    available_copies: book.availableCopies,
    total_copies: book.totalCopies,
    shelf_location: "",
    section_name: "",
    grade_level: book.gradeLevel,
    publisher: book.publisher,
    publication_year: book.publicationYear,
    language: book.language,
    page_count: book.pageCount,
    rating: book.rating,
  }
}

export const BORROW_SELECT = {
  id: true,
  bookId: true,
  userId: true,
  borrowDate: true,
  dueDate: true,
  returnDate: true,
  status: true,
  book: { select: { title: true } },
} as const

type BorrowRow = Pick<
  BorrowRecord,
  "id" | "bookId" | "userId" | "borrowDate" | "dueDate" | "returnDate" | "status"
> & { book: { title: string } }

/** Dates are days, not instants: the app parses them with `LocalDate`. */
function day(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function toBorrowingDto(record: BorrowRow) {
  return {
    id: record.id,
    book_id: record.bookId,
    book_title: record.book.title,
    user_id: record.userId,
    borrowed_date: day(record.borrowDate),
    due_date: day(record.dueDate),
    returned_date: record.returnDate ? day(record.returnDate) : null,
    status: record.status,
    // The schema records no fines. Sent as null rather than 0, which would
    // read as "nothing owed" when the truth is "not tracked".
    fine: null,
  }
}
