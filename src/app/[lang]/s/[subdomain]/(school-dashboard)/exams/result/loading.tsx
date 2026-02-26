// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable, SkeletonStats } from "@/components/atom/loading"

export default function ExamsResultLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <SkeletonStats count={4} />
      <SkeletonDataTable columns={7} rows={12} />
    </div>
  )
}
