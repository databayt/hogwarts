// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import { localize, localizeOne } from "@/components/translation/localize"
import type { Lang } from "@/components/translation/types"

// Common filter for visible catalog books
const CATALOG_VISIBLE = {
  status: "PUBLISHED" as const,
  approvalStatus: "APPROVED" as const,
  visibility: { in: ["PUBLIC" as const, "SCHOOL" as const] },
}

/**
 * The collaborate section's one featured book — matched against the RAW title
 * before `localize()` runs. The catalog is authored centrally in English (see
 * `CATALOG_GLOBAL` in the translation registry), so this match is stable
 * regardless of the reader's language; matching the LOCALIZED title instead
 * would silently return nothing on /ar.
 *
 * This exact edition, because it is the one the section's photograph is of.
 * The photograph is fixed (see `collaborate-section.tsx`), so the book beside
 * it has to be too — pick the highest-rated or newest title instead and the
 * picture stops matching the words.
 */
const FEATURED_BOOK_TITLE = "Harry Potter and the Philosopher's Stone"

/**
 * `/library`'s shelves, for the page and for the phone
 * (`/api/mobile/library/home`): the school's visible catalog in the reader's
 * language, the one featured book and its blurb, and the four rows cut the
 * way the page cuts them.
 */
export async function loadLibraryHome(schoolId: string, lang: string | undefined) {
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

  // Resolved from the RAW (pre-translation) title -- see FEATURED_BOOK_TITLE
  // above. `undefined` when the school has hidden it or the catalog seed
  // hasn't run; the section below simply doesn't render in that case.
  const featuredRaw = catalogBooks.find((b) => b.title === FEATURED_BOOK_TITLE)

  // Batched translation: one localize() call for all books.
  const localizedCatalogBooks = await localize("Book", catalogBooks, {
    schoolId,
    lang: (lang || "ar") as Lang,
  })

  // Map Book to the shape BookCard/BookList expects
  const books = localizedCatalogBooks.map((cb) => ({
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

  // The collaborate section's one book, with its real id and cover -- found
  // by id rather than re-filtered from `books`, so it renders even when it
  // isn't the freshest/highest-rated title and would otherwise miss both the
  // hero slot and every row below. Independent of `restBooks`: a school that
  // hides this title (`BookSelection.isActive: false`) never sees it here
  // either, because `catalogBooks` already dropped it before `featuredRaw`
  // was resolved.
  const featuredBook = featuredRaw
    ? (books.find((b) => b.id === featuredRaw.id) ?? null)
    : null

  // The featured book's blurb, fetched and translated on its own.
  //
  // `description` stays OUT of the list `select` above deliberately. It is a
  // registered translatable field, so putting it there would have `localize()`
  // translate a paragraph for every book on the page — fifty-odd of them, all
  // but one never read — where this section shows exactly one. One extra row
  // read is the cheaper half of that trade.
  //
  // It is read from the Book row rather than written into the dictionary: the
  // blurb belongs to the book, and the featured title can change. An earlier
  // pass removed the paragraph entirely while deleting the invented
  // `featuredBookDescription` key it had been reading; the key was rightly
  // gone, but the text should have moved to the row, not vanished.
  const featuredDescription = featuredRaw
    ? ((
        await localizeOne(
          "Book",
          await db.book.findUnique({
            where: { id: featuredRaw.id },
            select: { description: true },
          }),
          { schoolId, lang: (lang || "ar") as Lang }
        )
      )?.description ?? null)
    : null

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

  return {
    books,
    heroBook,
    featuredBook,
    featuredDescription,
    latestBooks,
    featuredBooks,
    literatureBooks,
    scienceBooks,
  }
}
