// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton({ label }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">{label ?? "Loading…"}</span>
      {/* Header Skeleton */}
      <div>
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Transactions Table Skeleton */}
      <div className="bg-card rounded-lg border">
        <div className="border-b p-6">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-4 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
