// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import {
  SkeletonList,
  SkeletonPageNav,
  SkeletonStats,
} from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={3} />

      {/* Stats cards */}
      <SkeletonStats count={3} columns="grid-cols-3" />

      {/* Notifications list */}
      <SkeletonList items={12} />
    </div>
  )
}
