// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { BOOK_GRADE_LEVELS, LIBRARY_CONFIG } from "../config"
import BookCard from "./book-card"
import BooksToolbar from "./books-toolbar"

interface Props {
  searchParams?: {
    page?: string
    search?: string
    genre?: string
    gradeLevel?: string
  }
  dictionary?: Record<string, unknown>
}

const GRADE_LEVEL_LABELS: Record<string, string> = {
  GENERAL: "General",
  KG: "KG",
  PRIMARY: "Primary",
  INTERMEDIATE: "Intermediate",
  SECONDARY: "Secondary",
}

export default async function AllBooksContent({
  searchParams,
  dictionary,
}: Props) {
  const { schoolId } = await getTenantContext()
  const lib = (dictionary as Record<string, Record<string, unknown>>)
    ?.library as Record<string, string> | undefined

  if (!schoolId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="mb-4">
          {lib?.schoolContextNotFound || "School context not found"}
        </h2>
        <p className="muted">
          {lib?.unableToLoadLibrary ||
            "Unable to load library. Please contact support."}
        </p>
      </div>
    )
  }

  const page = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1)
  const search = searchParams?.search || ""
  const genre = searchParams?.genre || ""
  const gradeLevel = searchParams?.gradeLevel || ""
  const perPage = LIBRARY_CONFIG.BOOKS_PER_PAGE

  // Build where clause — only show catalog books with active selections, plus legacy books
  const where: Record<string, unknown> = {
    schoolId,
    OR: [
      // Catalog books: only if selection is active
      {
        catalogBookId: { not: null },
        catalogBook: {
          schoolSelections: { some: { schoolId, isActive: true } },
        },
      },
      // Legacy books: always show during transition
      { catalogBookId: null },
    ],
  }

  if (search) {
    // Wrap existing OR with AND to combine with search
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

  // Parallel fetch: books + count + distinct genres
  const [books, totalCount, distinctGenres] = await Promise.all([
    db.book.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.book.count({ where }),
    db.book.findMany({
      where: { schoolId },
      select: { genre: true },
      distinct: ["genre"],
    }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)
  const genres = distinctGenres.map((g) => g.genre)

  if (totalCount === 0 && !search && !genre && !gradeLevel) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="bg-muted mb-6 flex h-24 w-24 items-center justify-center rounded-full">
          <svg
            className="text-muted-foreground h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold">
          {lib?.noBooks || "No books available"}
        </h2>
        <p className="text-muted-foreground max-w-md text-center">
          {lib?.emptyLibrary ||
            "The library is empty. Check back later or contact your library administrator to add books."}
        </p>
      </div>
    )
  }

  // Build query string helper
  function buildHref(params: Record<string, string>) {
    const sp = new URLSearchParams()
    if (params.search) sp.set("search", params.search)
    if (params.genre) sp.set("genre", params.genre)
    if (params.gradeLevel) sp.set("gradeLevel", params.gradeLevel)
    if (params.page && params.page !== "1") sp.set("page", params.page)
    const qs = sp.toString()
    return qs ? `?${qs}` : ""
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1>{(lib as Record<string, any>)?.hero?.title || "Revelio"}</h1>
        <p className="text-muted-foreground">
          {(lib as Record<string, any>)?.hero?.subtitle || "Unlock hidden."}
        </p>
      </div>

      {/* Search and filter toolbar */}
      <BooksToolbar
        genres={genres}
        gradeLevelLabels={GRADE_LEVEL_LABELS}
        searchPlaceholder={lib?.searchBooks || "Search books"}
        genreLabel={lib?.genre || "Genre"}
        gradeLabel={lib?.grade || "Grade"}
      />

      {/* Results count */}
      <p className="text-muted-foreground">
        {totalCount} {lib?.booksInLibrary || "books in the library"}
      </p>

      {/* Book grid or no results */}
      {books.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </ul>
      ) : (
        <div className="flex min-h-[30vh] flex-col items-center justify-center">
          <p className="text-muted-foreground">
            {lib?.noResults || "No books found matching your search"}
          </p>
        </div>
      )}

      {/* See More pagination */}
      {page < totalPages && (
        <div className="flex justify-center">
          <Link
            href={buildHref({
              search,
              genre,
              gradeLevel,
              page: String(page + 1),
            })}
            className="text-muted-foreground hover:underline"
          >
            {lib?.seeMore || "See More"}
          </Link>
        </div>
      )}
    </div>
  )
}
