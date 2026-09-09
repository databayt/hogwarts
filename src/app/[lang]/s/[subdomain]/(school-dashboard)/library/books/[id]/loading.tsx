// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/**
 * Mirrors `library/book-detail/content.tsx`: a full-bleed tinted panel with a
 * centred stack, then a narrow column of rule-divided sections.
 *
 * The panel carries the same escape margins as the hero it stands in for.
 * Without them the skeleton is a boxed card and the real page is edge to edge,
 * so the whole layout jumps sideways the moment the data lands.
 */
export default function Loading() {
  return (
    <div data-immersive className="pt-2 pb-10">
      <div className="bg-muted ms-[calc(-0.5rem-var(--container-px,0px))] me-[calc(-0.5rem-var(--container-px,0px))] -mt-2 w-[calc(100%+1rem+2*var(--container-px,0px))] sm:ms-0 sm:me-[calc(-1*var(--container-px,0px))] sm:w-[calc(100%+var(--container-px,0px))]">
        <div className="mx-auto flex max-w-xl flex-col items-center px-6 pt-10 pb-9">
          <Skeleton className="aspect-[2/3] w-40 rounded-lg sm:w-48" />
          <Skeleton className="mt-6 h-4 w-36" />
          <Skeleton className="mt-5 h-8 w-64" />
          <Skeleton className="mt-2 h-6 w-40" />
          <Skeleton className="mt-3 h-5 w-48" />
          <Skeleton className="mt-7 h-40 w-full rounded-2xl" />
        </div>
      </div>

      <div className="mx-auto max-w-xl px-6 pt-8 [&>*+*]:mt-8 [&>*+*]:border-t [&>*+*]:pt-8">
        {/* About */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Information */}
        <div className="space-y-1">
          <Skeleton className="mb-2 h-6 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-6 border-b py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Two shelves */}
        {Array.from({ length: 2 }).map((_, shelf) => (
          <div key={shelf} className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-4 overflow-hidden pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-28 shrink-0 space-y-2 sm:w-32">
                  <Skeleton className="aspect-[2/3] rounded-md" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
