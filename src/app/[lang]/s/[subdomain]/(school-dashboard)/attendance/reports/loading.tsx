// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-72 rounded-full" />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-9 w-[200px] rounded-full" />
        <Skeleton className="h-9 w-[150px] rounded-full" />
        <Skeleton className="h-9 w-[220px] rounded-full" />
      </div>
      <div className="space-y-3 rounded-2xl border p-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}
