// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function OfferLoading() {
  return (
    <div className="min-h-screen py-6 sm:py-12">
      <div className="container mx-auto max-w-3xl space-y-6 px-4">
        {/* Header - icon + congratulations + student name */}
        <div className="text-center">
          <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto mt-2 h-5 w-40" />
        </div>

        {/* Offer details card */}
        <div className="rounded-xl border">
          <div className="space-y-1.5 p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-3 px-6 pb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Fee schedule card */}
        <div className="rounded-xl border">
          <div className="space-y-1.5 p-6">
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="space-y-2 px-6 pb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  )
}
