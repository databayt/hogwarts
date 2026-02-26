// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <SkeletonDataTable columns={4} rows={6} />
    </div>
  )
}
