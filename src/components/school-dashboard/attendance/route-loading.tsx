// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/**
 * Generic loading skeleton for attendance sub-routes that do async server work
 * (auth + tenant context + dictionary) and lacked their own Suspense fallback.
 */
export default function AttendanceRouteLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )
}
