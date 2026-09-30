// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/**
 * The page's outline — the green banner, the stat panel, then a section of
 * rows with a date tile each — so the route is prefetchable and a tap draws
 * its shape at once.
 */
export default function Loading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-[200px] w-full rounded-[36px]" />
      <Skeleton className="h-[152px] w-full rounded-xl md:max-w-2xl" />
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="flex flex-col">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="size-14 shrink-0 rounded-[29.2%]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-56 max-w-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
