import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { BOOK_GENRES, LIBRARY_CONFIG } from "../config"
import BookList from "./content"

interface Props {
  searchParams?: {
    page?: string
    search?: string
    genre?: string
  }
  dictionary?: Record<string, unknown>
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
  const perPage = LIBRARY_CONFIG.BOOKS_PER_PAGE

  // Build where clause
  const where: Record<string, unknown> = { schoolId }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ]
  }

  if (genre) {
    where.genre = genre
  }

  // Parallel fetch: books + count
  const [books, totalCount] = await Promise.all([
    db.book.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.book.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  if (totalCount === 0 && !search && !genre) {
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
    if (params.page && params.page !== "1") sp.set("page", params.page)
    const qs = sp.toString()
    return qs ? `?${qs}` : ""
  }

  return (
    <div className="space-y-6">
      {/* Search and filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex flex-1 gap-2" action="" method="GET">
          <Input
            name="search"
            placeholder={lib?.searchBooks || "Search books"}
            defaultValue={search}
            className="max-w-sm"
          />
          {genre && <input type="hidden" name="genre" value={genre} />}
          <Button type="submit" variant="secondary" size="sm">
            {lib?.searchBooks || "Search"}
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Link
            href={buildHref({ search, genre: "", page: "1" })}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              !genre
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {lib?.allGenres || "All Genres"}
          </Link>
          {BOOK_GENRES.slice(0, 6).map((g) => (
            <Link
              key={g}
              href={buildHref({ search, genre: g, page: "1" })}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                genre === g
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {g}
            </Link>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-muted-foreground">
        {totalCount} {lib?.booksInLibrary || "books in the library"}
      </p>

      {/* Book list or no results */}
      {books.length > 0 ? (
        <BookList
          title={lib?.allBooks || "All Books"}
          books={books}
          containerClassName=""
        />
      ) : (
        <div className="flex min-h-[30vh] flex-col items-center justify-center">
          <p className="text-muted-foreground">
            {lib?.noResults || "No books found matching your search"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={buildHref({
                  search,
                  genre,
                  page: String(page - 1),
                })}
              >
                {lib?.previous || "Previous"}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {lib?.previous || "Previous"}
            </Button>
          )}

          <span className="text-muted-foreground text-sm">
            {lib?.page || "Page"} {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={buildHref({
                  search,
                  genre,
                  page: String(page + 1),
                })}
              >
                {lib?.next || "Next"}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {lib?.next || "Next"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
