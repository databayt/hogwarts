// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:justify-between lg:gap-10">
      {/* Left column - FormHeading */}
      <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
      </div>

      {/* Right column - Academic form (3 sections) */}
      <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
        <div className="space-y-8">
          {/* Previous Education section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Applying For section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Achievements textarea */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
