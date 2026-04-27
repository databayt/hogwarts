// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export function TransportationListSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function TransportationStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  )
}
