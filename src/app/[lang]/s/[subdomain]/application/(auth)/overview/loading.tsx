// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col pb-24">
      <div className="flex flex-1 items-center">
        <div className="w-full">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Left Side - Title */}
            <div>
              <Skeleton className="mb-2 h-8 w-64 sm:h-9 md:h-10" />
              <Skeleton className="h-8 w-40 sm:h-9 md:h-10" />
            </div>

            {/* Right Side - 3 Stages */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="flex flex-1 gap-3">
                    <Skeleton className="h-5 w-4 flex-shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="mb-1 h-5 w-28" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                  </div>
                  <Skeleton className="hidden h-14 w-14 flex-shrink-0 rounded-lg md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <footer className="bg-background fixed start-0 end-0 bottom-0 px-4 py-3 sm:px-6 sm:py-4 md:px-12 lg:px-20">
        <Separator className="mx-auto mb-3 w-full max-w-5xl sm:mb-4" />
        <div className="mx-auto flex w-full max-w-5xl items-center justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </footer>
    </div>
  )
}
