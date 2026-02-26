// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/atom/loading"

export default function YearLevelsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <SkeletonDataTable columns={5} rows={10} />
    </div>
  )
}
