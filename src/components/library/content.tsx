// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import BookList from "./book-list/content"
import { CollaborateSection } from "./collaborate-section"
import { LibraryHero } from "./hero"
import { loadLibraryHome } from "./load"

interface Props {
  userId: string
  dictionary?: Record<string, unknown>
  lang?: string
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

  const {
    books,
    featuredBook,
    featuredDescription,
    latestBooks,
    featuredBooks,
    literatureBooks,
    scienceBooks,
  } = await loadLibraryHome(schoolId, lang)

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
      {/* The green brand banner — the same object as /live's status hero */}
      <LibraryHero
        lang={lang}
        dictionary={dictionary as Dictionary | undefined}
      />

      {/* One featured book -- the same cover the marketing site shows. */}
      {featuredBook && (
        <CollaborateSection
          lang={lang}
          dictionary={dictionary as Dictionary | undefined}
          book={featuredBook}
          description={featuredDescription}
        />
      )}

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
