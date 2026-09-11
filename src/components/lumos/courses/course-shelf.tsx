"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { CatalogCourseType } from "@/components/lumos/data/catalog/get-all-courses"

import { CourseCard } from "./course-card"

interface CourseShelfProps {
  title: string
  courses: CatalogCourseType[]
  lang: string
  dictionary?: Record<string, any>
  /** Where the shelf's arrow goes. Omit for a shelf with no fuller view. */
  href?: string
  /** See `CourseCard.showGrade` — off for a shelf that IS a single grade. */
  showGrade?: boolean
}

/**
 * One horizontally-scrolling row of courses.
 *
 * The scroller matches the home page's Continue Watching strip — same
 * `no-scrollbar` overflow, same fixed-width cards — so the two read as one
 * system when a signed-in learner sees both stacked.
 *
 * The negative margin plus matching padding is what lets a card's hover ring
 * and focus outline breathe without being clipped by `overflow-x-auto`, while
 * the first card still lines up with the page's own edge.
 *
 * Nothing here is direction-aware: `overflow-x-auto` follows the document's
 * `dir`, so an Arabic reader scrolls from the right with no transform. The
 * arrow is the one exception, and it mirrors with `rtl:rotate-180`.
 */
export function CourseShelf({
  title,
  courses,
  lang,
  dictionary,
  href,
  showGrade = false,
}: CourseShelfProps) {
  // A shelf with nothing on it renders nothing. Every shelf on this page is
  // derived from real catalog rows, so an empty one means the school does not
  // offer that grade — not that we should invent filler for it.
  if (courses.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {href ? (
          <Link
            href={href}
            aria-label={title}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          >
            <ArrowRight className="size-5 rtl:rotate-180" />
          </Link>
        ) : null}
      </div>

      <div className="no-scrollbar -mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            lang={lang}
            dictionary={dictionary}
            showGrade={showGrade}
            className="w-40 shrink-0 sm:w-48"
          />
        ))}
      </div>
    </section>
  )
}
