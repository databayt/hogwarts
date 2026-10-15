// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-72 rounded-full" />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-60 rounded-full" />
        <Skeleton className="h-9 w-[220px] rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[320px] w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    </div>
  )
}
