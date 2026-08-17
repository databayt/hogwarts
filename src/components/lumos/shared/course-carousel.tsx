"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"

import { typographyVariants } from "@/lib/typography"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

/**
 * Shared basis for a course slide — one card on phones, two on small tablets,
 * three on medium tablets, five from `lg` up (5 per row). Kept as a constant
 * so every lumos carousel shows the same number of cards per breakpoint.
 */
export const COURSE_SLIDE_BASIS =
  "basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5"

interface Props {
  title: string
  description?: string
  /** Optional link/button rendered opposite the title (e.g. "View All"). */
  action?: ReactNode
  /** Locale — drives embla's scroll direction, which CSS alone can't flip. */
  lang: string
  /** `CarouselItem` elements, usually built with `COURSE_SLIDE_BASIS`. */
  children: ReactNode
}

/**
 * Titled horizontal strip of course cards.
 *
 * There are deliberately no prev/next buttons: the strip is dragged (mouse or
 * touch). Their default `-start-12 / -end-12` offsets overhang a dashboard
 * column anyway, and Abdout asked for the heading row to carry the title alone.
 */
export function CourseCarousel({
  title,
  description,
  action,
  lang,
  children,
}: Props) {
  return (
    <Carousel
      opts={{ align: "start", direction: lang === "ar" ? "rtl" : "ltr" }}
      className="w-full"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* Bare <h2> renders at 16px/400 in this app — it needs the shared
              title variant to read as a section heading. */}
          <h2 className={typographyVariants.cardTitle}>{title}</h2>
          {description && <p className="muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <CarouselContent>{children}</CarouselContent>
    </Carousel>
  )
}

export { CarouselItem as CourseSlide }
