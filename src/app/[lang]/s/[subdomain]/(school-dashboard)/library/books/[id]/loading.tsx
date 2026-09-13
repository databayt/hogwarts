// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Mirrors `library/book-detail/content.tsx` box for box: the green title panel,
 * then a narrow column of rule-divided sections.
 *
 * Every row is a WRAPPER at the real element's measured line-box height with a
 * shorter bar inside it, not a bare bar — a bar the height of the text's glyphs
 * is shorter than the line the text occupies, and ten of those stacked is how
 * the old skeleton came out 24px short of the hero it stood in for. Measured
 * on /ar at 390 and 1440: hero 684 / 740, about at 716, information 894
 * (45px rows), shelves 1354 and 1699 (232px items).
 *
 * The panel carries the same escape margins as the hero, and the same green.
 * It used to be `bg-muted`, so every open flashed grey before turning green —
 * the loudest jump on the page.
 */

// Grey shimmer reads as a hole on the green. The bars take the hero's own ink
// at the card's alpha instead; twMerge lets these `from/via/to` replace the
// base Skeleton's accent stops.
const ON_GREEN = "from-[#050505]/10 via-[#050505]/[0.04] to-[#050505]/10"

export default function Loading() {
  return (
    <div data-immersive className="pt-2 pb-10">
      <div className="ms-[calc(-0.5rem-var(--container-px,0px))] me-[calc(-0.5rem-var(--container-px,0px))] -mt-2 w-[calc(100%+1rem+2*var(--container-px,0px))] bg-[#00bc6d] sm:ms-0 sm:me-[calc(-1*var(--container-px,0px))] sm:w-[calc(100%+var(--container-px,0px))]">
        <div className="mx-auto flex max-w-xl flex-col items-center px-6 pt-10 pb-9">
          {/* Cover — 160×240, 192×288 from `sm` */}
          <Skeleton className={cn("aspect-[2/3] w-40 sm:w-48", ON_GREEN)} />

          {/* Grade eyebrow — 13px caps over an 8px rule gap: 29 tall */}
          <div className="mt-6 h-[29px] pt-0.5">
            <Skeleton className={cn("h-3.5 w-14", ON_GREEN)} />
          </div>

          {/* Title — 30px leading-tight is 37.5, 36px from `sm` is 45 */}
          <div className="mt-5 flex h-[37.5px] items-center sm:h-[45px]">
            <Skeleton className={cn("h-7 w-40 sm:h-8 sm:w-44", ON_GREEN)} />
          </div>

          {/* Author — text-lg line, 28 */}
          <div className="mt-2 flex h-7 items-center">
            <Skeleton className={cn("h-4 w-24", ON_GREEN)} />
          </div>

          {/* Rating · genre — 15px at 1.5, 22.5 */}
          <div className="mt-3 flex h-[22.5px] items-center">
            <Skeleton className={cn("h-3.5 w-36", ON_GREEN)} />
          </div>

          {/* The action card, drawn as the card rather than one blob: its
              ground, two text rows, and the two 56px pills. 160 tall. */}
          <div className="mt-7 w-full rounded-[28px] bg-[#050505]/10 p-5">
            <div className="flex h-[26px] items-center">
              <Skeleton className={cn("h-4 w-14", ON_GREEN)} />
            </div>
            <div className="mt-0.5 flex h-5 items-center">
              <Skeleton className={cn("h-3 w-28", ON_GREEN)} />
            </div>
            <div className="mt-4 flex gap-3">
              <Skeleton className={cn("h-14 flex-1 rounded-full", ON_GREEN)} />
              <Skeleton className={cn("h-14 flex-1 rounded-full", ON_GREEN)} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-6 pt-8 [&>*+*]:mt-8 [&>*+*]:border-t [&>*+*]:pt-8">
        {/* About — heading 28, three clamped lines at 26 */}
        <div className="space-y-2">
          <div className="flex h-7 items-center">
            <Skeleton className="h-5 w-32" />
          </div>
          <div>
            {["w-full", "w-full", "w-2/3"].map((width, i) => (
              <div key={i} className="flex h-[26px] items-center">
                <Skeleton className={cn("h-4", width)} />
              </div>
            ))}
          </div>
        </div>

        {/* Information — 6 rows: the five catalog facts most rows carry plus
            Availability, which always renders. Borrow counts are conditional. */}
        <div className="space-y-1">
          <div className="mb-2 flex h-7 items-center">
            <Skeleton className="h-5 w-24" />
          </div>
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-[45px] items-center justify-between gap-6 border-b last:h-11 last:border-b-0"
              >
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Two shelves — item 232: jacket 168, 8, two title lines, author */}
        {Array.from({ length: 2 }).map((_, shelf) => (
          <div key={shelf} className="space-y-3">
            <div className="flex h-7 items-center">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="-mx-2 flex gap-4 overflow-hidden px-2 pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-28 shrink-0 sm:w-32">
                  <Skeleton className="aspect-[2/3] rounded-md" />
                  <div className="mt-2">
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3.5 w-full" />
                    </div>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3.5 w-2/3" />
                    </div>
                  </div>
                  <div className="flex h-4 items-center">
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
