// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"

import BookList from "./book-list/content"
import { CollaborateSection } from "./collaborate-section"
import { LibraryHero } from "./hero"

interface Props {
  userId: string
  dictionary?: Record<string, unknown>
  lang?: string
}

// Common filter for visible catalog books
const CATALOG_VISIBLE = {
  status: "PUBLISHED" as const,
  approvalStatus: "APPROVED" as const,
  visibility: { in: ["PUBLIC" as const, "SCHOOL" as const] },
}

export default async function LibraryContent({
  userId,
  dictionary,
  lang,
}: Props) {
  const { schoolId, role } = await getTenantContext()
  const lib = (dictionary as Record<string, Record<string, unknown>>)?.school
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

  // Get hidden book IDs for this school (books explicitly deactivated)
  const hiddenSelections = await db.bookSelection.findMany({
    where: { schoolId, isActive: false },
    select: { catalogBookId: true },
  })
  const hiddenBookIds = new Set(hiddenSelections.map((s) => s.catalogBookId))

  // Query global catalog books (visible to all schools)
  const catalogBooks = await db.book.findMany({
    where: {
      ...CATALOG_VISIBLE,
      ...(hiddenBookIds.size > 0
        ? { id: { notIn: Array.from(hiddenBookIds) } }
        : {}),
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      author: true,
      genre: true,
      coverUrl: true,
      coverColor: true,
      rating: true,
      createdAt: true,
    },
  })

  // Map Book to the shape BookCard/BookList expects
  const books = catalogBooks.map((cb) => ({
    id: cb.id,
    title: cb.title,
    author: cb.author,
    genre: cb.genre,
    coverUrl: cb.coverUrl ?? "",
    coverColor: cb.coverColor,
    rating: Math.round(cb.rating),
    createdAt: cb.createdAt,
  }))

  const heroBook = books[0] || null
  const restBooks = books.slice(1)

  // Categorize books
  const latestBooks = restBooks.slice(0, 12)
  const featuredBooks = restBooks.slice(12, 24)

  const literatureBooks = restBooks
    .filter((b) =>
      ["Fiction", "Classic", "Drama", "أدب", "شعر"].some((g) =>
        b.genre.includes(g)
      )
    )
    .slice(0, 12)

  const scienceBooks = restBooks
    .filter((b) =>
      ["Science", "History", "فلسفة"].some((g) => b.genre.includes(g))
    )
    .slice(0, 12)

  const hasBooks = books.length > 0
  const isAdmin = role === "ADMIN" || role === "DEVELOPER"

  if (!hasBooks) {
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
        {isAdmin && (
          <Button asChild className="mt-6" variant="outline">
            <Link href="/library/catalog">
              {lib?.browseCatalog || "Browse Catalog & Add Books"}
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-12 overflow-hidden">
      {/* Hero Section - Stream style */}
      <LibraryHero lang={lang} dictionary={dictionary} />

      {/* Collaborate Section */}
      <CollaborateSection lang={lang} dictionary={dictionary} />

      {/* Row 1: Latest Books */}
      {latestBooks.length > 0 && (
        <BookList
          title={lib?.latestBooks || "Latest Books"}
          books={latestBooks}
          containerClassName=""
        />
      )}

      {/* Row 2: Featured Books */}
      {featuredBooks.length > 0 && (
        <BookList
          title={lib?.featuredBooks || "Featured Books"}
          books={featuredBooks}
          containerClassName=""
        />
      )}

      {/* Row 3: Literature Books */}
      {literatureBooks.length > 0 && (
        <BookList
          title={lib?.literatureBooks || "Literature Books"}
          books={literatureBooks}
          containerClassName=""
        />
      )}

      {/* Row 4: Science Books */}
      {scienceBooks.length > 0 && (
        <BookList
          title={lib?.scienceBooks || "Science Books"}
          books={scienceBooks}
          containerClassName=""
        />
      )}
    </div>
  )
}
