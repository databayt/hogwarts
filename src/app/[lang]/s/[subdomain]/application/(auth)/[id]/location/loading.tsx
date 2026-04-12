// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function LocationLoading() {
  return (
    <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:justify-between lg:gap-10">
      {/* Left column - FormHeading */}
      <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
      </div>

      {/* Right column - Location form (Mapbox or manual fallback) */}
      <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
        <div className="space-y-6">
          {/* Search input */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          {/* Map placeholder */}
          <Skeleton className="h-[320px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
