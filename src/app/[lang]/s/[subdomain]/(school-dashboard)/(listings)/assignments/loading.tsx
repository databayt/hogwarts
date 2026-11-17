// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SkeletonDataTable } from "@/components/atom/loading"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Role-neutral outline: a toolbar, then rows on a phone / the table on a
 * desktop. The student's and guardian's views are row lists too, so the shape
 * holds for every role without reading the session.
 */
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-full sm:h-9 sm:w-56" />
        <Skeleton className="h-11 w-24 sm:h-9" />
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
            <Skeleton className="size-14 shrink-0 rounded-[29.2%]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <SkeletonDataTable columns={6} rows={10} />
      </div>
    </div>
  )
}
