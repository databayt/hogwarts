// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ChevronRight, Star } from "lucide-react"

import { cn } from "@/lib/utils"

import { BookCover } from "../book-cover"
import BorrowBook from "./borrow-book"

interface Props {
  title: string
  author: string
  genre: string
  rating: number
  coverUrl?: string | null
  coverColor?: string | null
  /** Grade-level label, already resolved. Omitted for a general-audience book. */
  gradeLabel?: string | null
  /** Raw `BookGradeLevel` behind the label — what the listing filters on. */
  gradeLevel?: string | null
  lang: string
  publicationYear?: number | null
  pageCount?: number | null
  availableCopies: number
  totalCopies: number
  /** Props forwarded to the borrow pill. */
  schoolBookId: string
  userId: string
  schoolId: string
  hasBorrowedBook: boolean
  borrowRecordId?: string
  dictionary?: Record<string, string>
}

/**
 * The tinted title panel, drawn the way Apple Books draws a book.
 *
 * The whole top of the page is one colour taken from the book's own cover,
 * with the cover floating on it and everything that identifies the book —
 * collection, title, author, rating — stacked underneath in one centred
 * column. The action sits in a translucent card at the foot, so the thing
 * you came to do is the last thing before the page turns white.
 *
 * The stack is centred at EVERY width. The reference is a phone and there is
 * no desktop version of it; widening this into two columns would be inventing
 * a layout rather than following one. The column is capped instead, and the
 * colour runs to the page edges around it.
 */
export function BookHero({
  title,
  author,
  genre,
  rating,
  coverUrl,
  coverColor,
  gradeLabel,
  gradeLevel,
  lang,
  publicationYear,
  pageCount,
  availableCopies,
  totalCopies,
  schoolBookId,
  userId,
  schoolId,
  hasBorrowedBook,
  borrowRecordId,
  dictionary: lib,
}: Props) {
  // `publicationYear • pageCount`, with either half allowed to be missing —
  // a catalog row carries whichever its source had.
  const format = [
    publicationYear ? String(publicationYear) : null,
    pageCount ? `${pageCount} ${lib?.pages || "pages"}` : null,
  ].filter(Boolean)

  return (
    <div
      className={cn(
        // Full-bleed, copied term for term from the lumos lesson hero, which
        // works this out in its own comment: TWO gutters stand between this
        // and the page edge — the dashboard container's phone `px-2` and the
        // root layout's `--container-px` (8px on a phone, 32px at `xl`) — and
        // both have to be cancelled. Above `sm` only the END side escapes,
        // because the sidebar sits on the start side of this container and a
        // negative start margin would run the colour underneath it.
        "relative ms-[calc(-0.5rem-var(--container-px,0px))] me-[calc(-0.5rem-var(--container-px,0px))] -mt-2 w-[calc(100%+1rem+2*var(--container-px,0px))]",
        "sm:ms-0 sm:me-[calc(-1*var(--container-px,0px))] sm:w-[calc(100%+var(--container-px,0px))]"
      )}
      style={{ backgroundColor: coverColor || "#1a1a2e" }}
    >
      {/* `coverColor` is whatever the cover happened to be — it can come back
          pale yellow, and white text on that is unreadable. The title card in
          the live room has the same problem and answers it the same way: a
          black scrim over the raw colour, which darkens a light tint without
          flattening a dark one. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/65" />

      <div className="relative mx-auto flex max-w-xl flex-col items-center px-6 pt-10 pb-9 text-center">
        <div
          className="aspect-[2/3] w-40 overflow-hidden rounded-lg shadow-[0_24px_50px_rgba(0,0,0,0.45)] sm:w-48"
          style={{ backgroundColor: coverColor || "#1a1a2e" }}
        >
          <BookCover
            coverUrl={coverUrl}
            coverColor={coverColor}
            title={title}
            author={author}
            width={192}
            height={288}
            priority
            textSize="md"
          />
        </div>

        {/* The reference's "APPLE BOOKS CLASSICS" line — the shelf this book
            belongs to. Ours is the grade it is written for, and a book for
            everybody names no grade rather than saying so.

            A LINK, because it draws a chevron: the reference's chevron opens
            the collection, and one on inert text promises a page that is not
            there. The listing takes `gradeLevel` and checks it against
            `BOOK_GRADE_LEVELS`, so the raw enum goes in the query, never the
            label. */}
        {gradeLabel && gradeLevel && (
          <Link
            href={`/${lang}/library/books?gradeLevel=${encodeURIComponent(gradeLevel)}`}
            className="mt-6 inline-flex items-center gap-1 border-b border-white/30 pb-2 text-[13px] font-semibold tracking-[0.12em] text-white/85 uppercase transition-opacity hover:opacity-80"
          >
            {gradeLabel}
            <ChevronRight className="size-3.5 rtl:rotate-180" />
          </Link>
        )}

        {/* No font family is set here on purpose. The reference is serif, and
            Arabic already reads that way — `--font-sans` under `ar` is the
            Thmanyah text face. Forcing `font-serif` would hand Arabic Georgia,
            which has no Arabic glyphs at all. */}
        <h1 className="mt-5 text-[30px] leading-tight font-bold text-balance text-white sm:text-4xl">
          {title}
        </h1>

        {/* Same reasoning as the eyebrow. There is no author filter, but the
            listing's `search` matches title OR author with `contains`, so this
            genuinely lands on this author's books. */}
        <Link
          href={`/${lang}/library/books?search=${encodeURIComponent(author)}`}
          className="mt-2 inline-flex items-center gap-1 text-lg text-white/90 transition-opacity hover:opacity-80"
        >
          {author}
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>

        {/* One line, the way the reference has it — a single star and the
            number, not a five-star row. There is no ratings COUNT on the
            model, so the reference's "(1.5k)" has no honest equivalent and is
            left out rather than invented. */}
        <p className="mt-3 flex items-center justify-center gap-2 text-[15px] text-white/80">
          {/* A book nobody has rated has no rating, and "0.0" reads as a bad
              one. The genre stands alone in that case, dot and all dropped. */}
          {rating > 0 && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-4 fill-white text-white" />
                {rating.toFixed(1)}
              </span>
              <span aria-hidden>&middot;</span>
            </>
          )}
          <span>{genre}</span>
        </p>

        {/* The action card. Everything about getting hold of the book lives
            inside it: what it is, how long, how many are left, and the pill
            that does it. */}
        <div className="mt-7 w-full rounded-2xl bg-white/12 p-4 text-start ring-1 ring-white/15 backdrop-blur-sm">
          <p className="text-[17px] font-semibold text-white">
            {lib?.book || "Book"}
          </p>
          {format.length > 0 && (
            <p className="mt-0.5 text-sm text-white/75">{format.join(" · ")}</p>
          )}
          <p className="mt-0.5 text-sm text-white/75">
            {availableCopies} {lib?.of || "of"} {totalCopies}{" "}
            {lib?.copiesAvailable || "copies available"}
          </p>

          <div className="mt-4">
            <BorrowBook
              bookId={schoolBookId}
              userId={userId}
              schoolId={schoolId}
              availableCopies={availableCopies}
              hasBorrowedBook={hasBorrowedBook}
              borrowRecordId={borrowRecordId}
              dictionary={lib}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
