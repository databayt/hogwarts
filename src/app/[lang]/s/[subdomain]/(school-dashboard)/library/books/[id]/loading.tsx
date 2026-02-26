// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Hero */}
      <div className="flex gap-8">
        <Skeleton className="aspect-[2/3] w-48 shrink-0 rounded" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-36 rounded" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Book Details */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-lg" />
      </div>

      {/* Borrowing Activity */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-14 rounded-lg" />
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Related Books */}
      <Skeleton className="h-px w-full" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
