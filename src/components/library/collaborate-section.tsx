// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: prop composition only. It was briefly a client component
// while the artwork was a remote cover that needed an `onError` fallback; the
// photograph below is a CDN asset that needs none, so the boundary is gone.

import Image from "next/image"
import Link from "next/link"

import { asset } from "@/lib/asset-url"
import { buttonVariants } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { BookListItem } from "./types"

interface CollaborateSectionProps {
  lang?: string
  dictionary?: Dictionary
  book: BookListItem
  /** The book's own blurb, already translated. Null when the row has none. */
  description?: string | null
}

/**
 * The library's second section: one book, spotlighted.
 *
 * The photograph is the original one this section shipped with -- kept at
 * Abdout's request -- served from `cdn.databayt.org/hogwarts/harry-potter.png`
 * through `asset()`. Worth knowing before it travels any further than this
 * page: it is a still from the FILM, not cover art, and the marketing block's
 * own notes rule it out over there for that reason ("the hero carries a Harry
 * Potter film still — never ship that frame on the marketing site",
 * `saas-marketing/CLAUDE.md`). It is decorative here; the book beside it is
 * the real thing.
 *
 * The TEXT is no longer decorative. This section used to read four dictionary
 * keys that do not exist in `dictionary.school.library` --
 * `featuredBookTitle`, `featuredBookAuthor`, `featuredBookDescription`,
 * `getBook` -- so its hardcoded English "or" fallback was what rendered, on
 * every school, in both languages, for as long as it shipped. Title and author
 * now come from the real `Book` row (already localized by `content.tsx`, which
 * resolves it -- see `FEATURED_BOOK_TITLE` there), the label reads the `by`
 * and `viewBook` keys that DO exist, and the CTA opens that book's own
 * `/library/books/[id]` instead of the generic list. No `book`, no section.
 *
 * The blurb went missing in that same pass: deleting the invented
 * `featuredBookDescription` key took the paragraph with it, leaving a title,
 * a byline and a button. It is back, and it comes from the row like the rest,
 * translated by `localize()` — `description` is a registered field on `Book`.
 */
export function CollaborateSection({
  lang = "en",
  dictionary,
  book,
  description,
}: CollaborateSectionProps) {
  const lib = dictionary?.school?.library

  return (
    <section className="dark:bg-muted/50 w-full max-w-full overflow-hidden rounded-2xl bg-[#F5F5F0]">
      <div className="flex flex-col lg:flex-row">
        {/* Image - Left side */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:w-1/2">
          <Image
            src={asset("/photos/harry-potter.png")}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Content - Right side */}
        <div className="flex flex-col justify-center p-8 lg:w-1/2 lg:p-12">
          <h2 className="mb-2 text-3xl font-semibold tracking-tight lg:text-4xl">
            {book.title}
          </h2>
          <p className="text-muted-foreground mb-4 text-lg">
            {lib?.by} {book.author}
          </p>
          {/* The blurb comes from the Book row and arrives translated — see
              `content.tsx`, which reads and localizes it. A row with no
              description renders no paragraph rather than a placeholder. */}
          {description && (
            <p className="text-muted-foreground mb-6 line-clamp-4 leading-relaxed">
              {description}
            </p>
          )}
          <div>
            <Link
              href={`/${lang}/library/books/${book.id}`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {lib?.viewBook}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
