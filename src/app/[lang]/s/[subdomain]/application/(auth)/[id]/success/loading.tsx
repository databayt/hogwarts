// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen py-6 sm:py-12">
      <div className="container mx-auto max-w-2xl space-y-6 px-4">
        {/* Header - green circle + title + subtitle */}
        <div className="text-center">
          <Skeleton className="mx-auto mb-4 h-20 w-20 rounded-full" />
          <Skeleton className="mx-auto h-8 w-72 sm:h-9" />
          <Skeleton className="mx-auto mt-3 h-5 w-80 max-w-full" />
        </div>

        {/* Application number card */}
        <div className="rounded-xl border text-center">
          <div className="space-y-2 p-6">
            <Skeleton className="mx-auto h-4 w-36" />
            <Skeleton className="mx-auto h-8 w-48" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
        </div>

        {/* Next steps card (4 numbered items) */}
        <div className="rounded-xl border">
          <div className="space-y-1.5 p-6">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-4 px-6 pb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action cards grid (2 columns on md) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-44" />
              </div>
            </div>
          </div>
        </div>

        {/* Back to home button */}
        <div className="text-center">
          <Skeleton className="mx-auto h-10 w-36" />
        </div>
      </div>
    </div>
  )
}
