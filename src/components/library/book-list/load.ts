// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

import { BOOK_GRADE_LEVELS, LIBRARY_CONFIG } from "../config"
import type { BookListItem } from "../types"

export interface AllBooksQuery {
  page: number
  search: string
  genre: string
  gradeLevel: string
}

/**
 * `/library/books` — one page of the school's visible catalog, newest first,
 * filtered by title/author search, genre and grade level — for the page and
 * for the phone (`/api/mobile/library/catalog`).
 */
export async function loadAllBooks(
  schoolId: string,
  { page, search, genre, gradeLevel }: AllBooksQuery
) {
  const perPage = LIBRARY_CONFIG.BOOKS_PER_PAGE
  const hiddenSelections = await db.bookSelection.findMany({
    where: { schoolId, isActive: false },
    select: { catalogBookId: true },
  })
  const hiddenBookIds = new Set(hiddenSelections.map((s) => s.catalogBookId))

  // Build where clause — query global Book, exclude hidden
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    visibility: { in: ["PUBLIC", "SCHOOL"] },
    ...(hiddenBookIds.size > 0
      ? { id: { notIn: Array.from(hiddenBookIds) } }
      : {}),
  }

  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
        ],
      },
    ]
  }

  if (genre) {
    where.genre = genre
  }

  if (gradeLevel && BOOK_GRADE_LEVELS.includes(gradeLevel as never)) {
    where.gradeLevel = gradeLevel
  }

  // Parallel fetch: catalog books + count + distinct genres
  const catalogSelect = {
    id: true,
    title: true,
    author: true,
    genre: true,
    coverUrl: true,
    coverColor: true,
    rating: true,
    createdAt: true,
  }

  const [catalogBooks, totalCount, distinctGenres] = await Promise.all([
    db.book.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: catalogSelect,
    }),
    db.book.count({ where }),
    db.book.findMany({
      where: {
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: { in: ["PUBLIC", "SCHOOL"] },
      },
      select: { genre: true },
      distinct: ["genre"],
    }),
  ])

  // Map to BookListItem shape
  const books: BookListItem[] = catalogBooks.map((cb) => ({
    id: cb.id,
    title: cb.title,
    author: cb.author,
    genre: cb.genre,
    coverUrl: cb.coverUrl ?? "",
    coverColor: cb.coverColor,
    rating: Math.round(cb.rating),
    createdAt: cb.createdAt,
  }))

  const totalPages = Math.ceil(totalCount / perPage)
  const genres = distinctGenres.map((g) => g.genre)

  return { books, totalCount, totalPages, genres, perPage }
}
