// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export function TransportationListSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function TransportationStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  )
}

/** Overview page: stats grid + recent assignments + expiring docs */
export function TransportationOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <TransportationStatsSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}

/** Detail page: header + 2-column info card + child table */
export function TransportationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

/** Reports page: stats + table */
export function TransportationReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <TransportationStatsSkeleton />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  )
}

/** Settings page: form skeleton */
export function TransportationSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
