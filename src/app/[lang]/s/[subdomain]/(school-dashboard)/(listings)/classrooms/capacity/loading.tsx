// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SkeletonDataTable, SkeletonStats } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonStats />
      <SkeletonDataTable columns={5} rows={8} />
    </div>
  )
}
