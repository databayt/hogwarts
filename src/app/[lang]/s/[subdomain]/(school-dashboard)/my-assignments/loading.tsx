// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/**
 * The student's assignment list — a heading and a column of cards — so the
 * route is prefetchable and a tap draws its outline at once.
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <ul className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-56 max-w-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    </div>
  )
}
