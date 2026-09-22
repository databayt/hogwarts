// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getTenantContext } from "@/lib/tenant-context"

import { BookAbout } from "./about"
import { BookShelf } from "./book-shelf"
import BookVideo from "./book-video"
import { BookHero } from "./hero"
import { BookInfoList } from "./info-list"
import { loadBookDetail } from "./load"

interface Props {
  bookId: string
  userId: string
  lang?: string
  dictionary?: Record<string, unknown>
}

/**
 * A book, read the way Apple Books reads one.
 *
 * The page is in two halves. The top is the book's own colour, edge to edge,
 * holding the cover and everything that identifies it, ending in the card that
 * borrows it. Below that the page turns to the ordinary ground and becomes
 * text: what the book is about, its facts as a list, then shelves of what to
 * read next.
 *
 * The old layout put a 192px cover beside a column of badges inside a
 * `max-w-2xl` box, with five headed sections stacked under it in the same
 * weight — the summary reading as loud as the title. Splitting it in two gives
 * the top half one job and lets the bottom half be quiet.
 */
export default async function LibraryBookDetailContent({
  bookId,
  userId,
  lang = "ar",
  dictionary,
}: Props) {
  const { schoolId } = await getTenantContext()
  const lib = (dictionary as Record<string, Record<string, unknown>>)
    ?.library as Record<string, string> | undefined

  if (!schoolId) {
    notFound()
  }

  const detail = await loadBookDetail({
    bookId,
    userId,
    schoolId,
    lang,
    dictionary,
  })
  if (!detail) {
    notFound()
  }
  const {
    shown,
    gradeLabel,
    infoRows,
    aboutParagraphs,
    schoolBook,
    activeBorrowRecord,
    relatedByAuthor,
    relatedSimilar,
  } = detail

  return (
    // `data-immersive` — read by the school-dashboard layout, which unpins the
    // header and lets the container stop clipping so the hero can reach the
    // page edges. On the page ROOT rather than on the hero, matching the lumos
    // lesson: the colour owns the top of the screen and the bar comes back on
    // the way up.
    <div data-immersive className="pt-2 pb-10">
      <BookHero
        title={shown.title}
        author={shown.author}
        genre={shown.genre}
        rating={shown.rating}
        coverUrl={shown.coverUrl}
        coverColor={shown.coverColor}
        gradeLabel={gradeLabel}
        gradeLevel={shown.gradeLevel}
        lang={lang}
        publicationYear={shown.publicationYear}
        pageCount={shown.pageCount}
        digitalFileUrl={shown.digitalFileUrl}
        availableCopies={schoolBook.availableCopies}
        totalCopies={schoolBook.totalCopies}
        schoolBookId={schoolBook.id}
        userId={userId}
        schoolId={schoolId}
        hasBorrowedBook={!!activeBorrowRecord}
        borrowRecordId={activeBorrowRecord?.id}
        dictionary={lib}
      />

      {/* Below the colour the page is ordinary again — one narrow column, each
          section divided from the next by a rule rather than by a gap. */}
      <div className="mx-auto max-w-xl px-6 pt-8 [&>*+*]:mt-8 [&>*+*]:border-t [&>*+*]:pt-8">
        {aboutParagraphs.length > 0 && (
          <BookAbout
            heading={lib?.aboutThisBook || "About This Book"}
            paragraphs={aboutParagraphs}
            moreLabel={lib?.more || "More"}
            lessLabel={lib?.less || "Less"}
          />
        )}

        <BookInfoList
          heading={lib?.information || "Information"}
          rows={infoRows}
        />

        {shown.videoUrl && (
          <section>
            <BookVideo videoUrl={shown.videoUrl} title={shown.title} />
          </section>
        )}

        <BookShelf
          heading={`${lib?.moreBy || "More by"} ${shown.author}`}
          books={relatedByAuthor}
          lang={lang}
        />

        <BookShelf
          heading={lib?.similarBooks || "You Might Also Like"}
          books={relatedSimilar}
          lang={lang}
        />
      </div>
    </div>
  )
}
