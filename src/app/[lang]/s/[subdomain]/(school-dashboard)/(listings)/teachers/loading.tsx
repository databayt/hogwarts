// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Teachers data table */}
      <SkeletonDataTable columns={5} rows={12} />
    </div>
  )
}
