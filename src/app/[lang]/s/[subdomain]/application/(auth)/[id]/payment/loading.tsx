// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen py-6 sm:py-12">
      <div className="container mx-auto max-w-2xl space-y-6 px-4">
        {/* Header - centered title + application number */}
        <div className="text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto mt-2 h-5 w-36" />
        </div>

        {/* Fee card */}
        <div className="rounded-xl border">
          <div className="space-y-1.5 p-6 text-center">
            <Skeleton className="mx-auto h-4 w-24" />
            <Skeleton className="mx-auto h-8 w-32 sm:h-9" />
          </div>
        </div>

        {/* 3 payment method cards */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border">
              <div className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
