// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the class list: pill nav, one row of choices, the inset list. */
export default function ManualAttendanceLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-72 rounded-full" />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-64 rounded-full" />
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
      <div className="divide-border/60 divide-y overflow-hidden rounded-2xl border">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ms-auto h-8 w-56 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
