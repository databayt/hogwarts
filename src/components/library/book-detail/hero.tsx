// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ChevronRight, Info, Star } from "lucide-react"

import { cn } from "@/lib/utils"

import { BookJacket } from "../book-jacket"
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
  /** The digital copy, when the catalog row has one. Drives the Read pill. */
  digitalFileUrl?: string | null
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
  digitalFileUrl,
  availableCopies,
  totalCopies,
  schoolBookId,
  userId,
  schoolId,
  hasBorrowedBook,
  borrowRecordId,
  dictionary: lib,
}: Props) {
  // `publicationYear · pageCount`, either half allowed to be missing — a
  // catalog row carries whichever its source had.
  //
  // The reference reads "January 1813 · 490 Pages" and this reads "1813 · 490
  // Pages", because there is no month to read: `Book.publicationYear` is an
  // Int and the schema holds no publication date. Printing a month would mean
  // inventing one.
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
        "sm:ms-0 sm:me-[calc(-1*var(--container-px,0px))] sm:w-[calc(100%+var(--container-px,0px))]",
        // One green, the marketing hero's `#00bc6d`, the same ground the
        // library's own banner stands on two pages up. It replaces a tint
        // taken from each book's `coverColor`, which meant the page changed
        // colour per book and needed a black scrim over it to keep any text
        // readable at all.
        //
        // Every piece of ink on this ground is pinned DARK and none of it is
        // tokenised, exactly as `library/hero.tsx` sets out: white on
        // `#00bc6d` measures about 2.5:1 and is unreadable, and
        // `primary-foreground` is white in light mode and black in dark, which
        // is backwards here. This ground does not invert.
        "bg-[#00bc6d] text-[#050505]"
      )}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 pt-10 pb-9 text-center">
        <BookJacket
          coverUrl={coverUrl}
          coverColor={coverColor}
          title={title}
          author={author}
          width={192}
          height={288}
          priority
          textSize="md"
          className="aspect-[2/3] w-40 shadow-[0_18px_40px_rgba(5,5,5,0.28)] sm:w-48"
        />

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
            className="mt-6 inline-flex items-center gap-1 border-b border-[#050505]/25 pb-2 text-[13px] font-semibold tracking-[0.12em] text-[#050505]/80 uppercase transition-opacity hover:opacity-80"
          >
            {gradeLabel}
            <ChevronRight className="size-3.5 rtl:rotate-180" />
          </Link>
        )}

        {/* No font family is set here on purpose. The reference is serif, and
            Arabic already reads that way — `--font-sans` under `ar` is the
            Thmanyah text face. Forcing `font-serif` would hand Arabic Georgia,
            which has no Arabic glyphs at all. */}
        <h1 className="mt-5 text-[30px] leading-tight font-bold text-balance sm:text-4xl">
          {title}
        </h1>

        {/* Same reasoning as the eyebrow. There is no author filter, but the
            listing's `search` matches title OR author with `contains`, so this
            genuinely lands on this author's books. */}
        <Link
          href={`/${lang}/library/books?search=${encodeURIComponent(author)}`}
          className="mt-2 inline-flex items-center gap-1 text-lg text-[#050505]/85 transition-opacity hover:opacity-70"
        >
          {author}
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>

        {/* One line, the way the reference has it — a single star and the
            number, not a five-star row. There is no ratings COUNT on the
            model, so the reference's "(1.5k)" has no honest equivalent and is
            left out rather than invented. */}
        <p className="mt-3 flex items-center justify-center gap-2 text-[15px] text-[#050505]/75">
          {/* A book nobody has rated has no rating, and "0.0" reads as a bad
              one. The genre stands alone in that case, dot and all dropped. */}
          {rating > 0 && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-4 fill-[#050505] text-[#050505]" />
                {rating.toFixed(1)}
              </span>
              <span aria-hidden>&middot;</span>
            </>
          )}
          <span>{genre}</span>
        </p>

        {/* The action card, three rows exactly as the reference has them: what
            this is, when and how long, then the two things you can do.
            
            The copies count used to sit as a fourth row and does not belong
            here — the reference's card names the edition, not the stock. It
            moved to the Information list below, where the rest of the facts
            about this book already live, and the pill still says Unavailable
            on its own when there is nothing to lend. */}
        <div className="mt-7 w-full rounded-[28px] bg-[#050505]/10 p-5 text-start">
          <p className="inline-flex items-center gap-1.5 text-[17px] font-semibold">
            {lib?.book || "Book"}
            <Info className="size-[15px] opacity-60" />
          </p>
          {format.length > 0 && (
            <p className="mt-0.5 text-sm text-[#050505]/70">
              {format.join(" · ")}
            </p>
          )}

          <div className="mt-4">
            <BorrowBook
              bookId={schoolBookId}
              userId={userId}
              schoolId={schoolId}
              availableCopies={availableCopies}
              hasBorrowedBook={hasBorrowedBook}
              borrowRecordId={borrowRecordId}
              digitalFileUrl={digitalFileUrl}
              dictionary={lib}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
