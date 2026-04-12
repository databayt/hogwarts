// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-3 sm:space-y-4 sm:px-4">
      {/* Welcome Header */}
      <div>
        <Skeleton className="mb-3 h-7 w-32 sm:mb-4 sm:h-8" />
      </div>

      {/* Start a new application section */}
      <div className="space-y-2 sm:space-y-3">
        <Skeleton className="h-5 w-48" />

        <div className="space-y-2">
          {/* Start from scratch option */}
          <div className="border-border flex min-h-[50px] w-full items-center justify-between border-b py-2 sm:min-h-[60px] sm:py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg sm:h-10 sm:w-10" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <Skeleton className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
          </div>

          {/* Import from profile option */}
          <div className="border-border flex min-h-[50px] w-full items-center justify-between border-b py-2 sm:min-h-[60px] sm:py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg sm:h-10 sm:w-10" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
            <Skeleton className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
