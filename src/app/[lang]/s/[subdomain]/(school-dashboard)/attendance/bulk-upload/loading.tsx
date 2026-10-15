// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the page: pill nav, one row of choices, the main panel. */
export default function AttendanceBulkUploadLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-72 rounded-full" />
      <Skeleton className="h-9 w-64 rounded-full" />
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  )
}
