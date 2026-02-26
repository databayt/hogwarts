// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStats } from "@/components/atom/loading"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-56" />

      {/* Stats cards */}
      <SkeletonStats count={5} />

      {/* Charts grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  )
}
