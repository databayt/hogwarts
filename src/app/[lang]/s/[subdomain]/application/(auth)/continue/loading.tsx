// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header - centered icon + title + subtitle */}
      <div className="text-center">
        <Skeleton className="mx-auto mb-6 h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="mx-auto mt-3 h-5 w-80 max-w-md" />
      </div>

      {/* Card with form fields */}
      <div className="rounded-xl border p-6">
        <div className="space-y-1.5 pb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          {/* Email field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          {/* Session token field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-10 w-full" />
          </div>
          {/* Submit button */}
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Start new link */}
      <div className="space-y-4 text-center">
        <Skeleton className="mx-auto h-4 w-56" />
        <Skeleton className="mx-auto h-10 w-44" />
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-dashed p-6">
        <div className="flex items-start gap-3">
          <Skeleton className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
      </div>
    </div>
  )
}
