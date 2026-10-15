// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the plan editor: three plan columns, the limits group, the estimate. */
export default function Loading() {
  return (
    <div data-wide className="space-y-10">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-2xl border p-5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="ms-4 h-3 w-16" />
        <div className="divide-y rounded-2xl border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-1 w-48" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  )
}
