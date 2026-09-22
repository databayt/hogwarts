// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A catalog book as a shelf draws it — the web's `BookListItem`, snake_cased.
 * Ids are CATALOG ids (`Book.id`), the ones `/library/books/[id]` takes; the
 * school's lending copy only appears on the book page, as `school_book_id`.
 */
export function toCatalogCardDto(book: {
  id: string
  title: string
  author: string
  genre: string
  coverUrl: string | null
  coverColor: string | null
  rating: number
}) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    genre: book.genre,
    cover_url: book.coverUrl || null,
    cover_color: book.coverColor,
    rating: book.rating,
  }
}

export function langOf(request: Request): "ar" | "en" {
  return new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar"
}
