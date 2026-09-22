// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { getDictionary } from "@/components/internationalization/dictionaries"
import { loadBookDetail } from "@/components/library/book-detail/load"

import { authenticate, isAuthError } from "../../../lib/authenticate"
import { langOf, toCatalogCardDto } from "../../lib/catalog-dto"

/**
 * `/library/books/[id]` as data — the same `loadBookDetail` the page renders:
 * the book in the reader's language, its grade eyebrow, the Information rows
 * with their labels, the About paragraphs, the reader's loan, and the two
 * shelves. Borrowing goes through `/books/{school_book_id}/borrow` and
 * returning through `/borrowings/{borrow_record_id}/return`.
 *
 * GET /api/mobile/library/catalog/:id?lang=ar|en
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { id } = await params
    const lang = langOf(request)
    const dictionary = await getDictionary(lang)
    const detail = await loadBookDetail({
      bookId: id,
      userId: auth.userId,
      schoolId: auth.schoolId,
      lang,
      dictionary: dictionary.school as Record<string, unknown>,
    })
    if (!detail) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }
    const { shown, schoolBook } = detail
    return NextResponse.json({
      id: shown.id,
      title: shown.title,
      author: shown.author,
      genre: shown.genre,
      rating: shown.rating,
      cover_url: shown.coverUrl || null,
      cover_color: shown.coverColor,
      grade_label: detail.gradeLabel,
      grade_level: shown.gradeLevel,
      publication_year: shown.publicationYear,
      page_count: shown.pageCount,
      digital_file_url: shown.digitalFileUrl,
      video_url: shown.videoUrl,
      school_book_id: schoolBook.id,
      available_copies: schoolBook.availableCopies,
      total_copies: schoolBook.totalCopies,
      borrow_record_id: detail.activeBorrowRecord?.id ?? null,
      about: detail.aboutParagraphs,
      info: detail.infoRows,
      more_by_author: detail.relatedByAuthor.map(toCatalogCardDto),
      similar: detail.relatedSimilar.map(toCatalogCardDto),
    })
  } catch (error) {
    console.error("[mobile/library/catalog/:id] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
