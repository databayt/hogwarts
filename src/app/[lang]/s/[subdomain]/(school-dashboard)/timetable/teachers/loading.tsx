// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the board: heading, the waiting badges, then one card per grade. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-44 rounded-full" />
        <Skeleton className="h-6 w-36 rounded-full" />
      </div>
      {[0, 1].map((card) => (
        <div key={card} className="space-y-3 rounded-xl border p-6">
          <Skeleton className="h-5 w-28" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-3">
              <Skeleton className="h-8 w-24" />
              {[0, 1, 2, 3, 4].map((cell) => (
                <Skeleton key={cell} className="h-8 w-36" />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
