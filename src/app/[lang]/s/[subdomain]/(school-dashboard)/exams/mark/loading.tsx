// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import {
  SkeletonDataTable,
  SkeletonPageNav,
  SkeletonStats,
} from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={4} />

      {/* Marking stats */}
      <SkeletonStats count={3} columns="grid-cols-3" />

      {/* Submissions data table */}
      <SkeletonDataTable columns={7} rows={12} />
    </div>
  )
}
