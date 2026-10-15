// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

// Mirrors the editor: grouped section list on the start side, one narrow
// form column beside it.
export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      <div className="hidden space-y-6 lg:block">
        {[5, 5, 3].map((rows, g) => (
          <div key={g} className="space-y-2">
            <Skeleton className="mx-3 h-3 w-16" />
            <div className="divide-y rounded-2xl border">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="space-y-1.5 px-3 py-2.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center py-8">
        <div className="w-full max-w-[560px] space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="divide-y rounded-2xl border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
