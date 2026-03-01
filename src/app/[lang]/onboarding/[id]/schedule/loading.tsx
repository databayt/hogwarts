// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-3 w-64" />
    </div>
  )
}
