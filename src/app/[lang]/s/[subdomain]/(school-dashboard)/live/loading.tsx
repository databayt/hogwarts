// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/**
 * The live landing — the state card up top, then today's sessions — so the
 * sidebar link is prefetchable and a tap draws the outline at once.
 */
export default function Loading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
