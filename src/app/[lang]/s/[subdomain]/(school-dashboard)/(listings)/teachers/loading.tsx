// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* PlatformToolbar skeleton */}
      <div className="flex w-full flex-wrap items-center gap-2 p-1">
        {/* Left: search input */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-40 lg:w-56" />
        </div>
        {/* Right: column toggle, view toggle, export, create */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* DataTable skeleton: 5 visible columns (name, department, workload, status, actions) */}
      <div className="overflow-hidden rounded-md border">
        {/* Header row */}
        <div className="bg-muted/50 border-b">
          <div className="flex h-12 items-center px-4">
            <div className="flex-[2] px-2">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex-1 px-2">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex-1 px-2">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex-1 px-2">
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="w-[60px] px-2" />
          </div>
        </div>

        {/* Data rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[57px] items-center border-b px-4 last:border-b-0"
          >
            {/* Name with avatar */}
            <div className="flex flex-[2] items-center gap-3 px-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            {/* Department */}
            <div className="flex-1 px-2">
              <Skeleton className="h-4 w-20" />
            </div>
            {/* Workload (subjects + classes) */}
            <div className="flex-1 px-2">
              <Skeleton className="h-4 w-24" />
            </div>
            {/* Status badge */}
            <div className="flex-1 px-2">
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            {/* Actions */}
            <div className="w-[60px] px-2">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      <div className="flex justify-center">
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  )
}
