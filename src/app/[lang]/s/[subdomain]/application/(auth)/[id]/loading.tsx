// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl pb-20">
      {/* FormLayout skeleton: two-column on lg */}
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:justify-between lg:gap-10">
        {/* Left column - FormHeading */}
        <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72 max-w-full" />
          </div>
        </div>

        {/* Right column - Form fields */}
        <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* FormFooter skeleton */}
      <footer className="bg-background fixed start-0 end-0 bottom-0 px-4 sm:px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            <Skeleton className="h-1 w-full" />
            <Skeleton className="h-1 w-full" />
            <Skeleton className="h-1 w-full" />
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl items-center justify-between py-3 sm:py-4">
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </footer>
    </div>
  )
}
