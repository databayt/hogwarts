// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function AttachmentsLoading() {
  return (
    <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:justify-between lg:gap-10">
      {/* Left column - FormHeading */}
      <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
      </div>

      {/* Right column - Upload grid (2-col, 3-col on sm) */}
      <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {/* Profile photo (avatar) */}
          <div className="flex items-center justify-center">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          {/* 5 document cards */}
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
