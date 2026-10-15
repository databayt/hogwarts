// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors Today: date line, marking progress, figures, one inset list. */
export default function Loading() {
  return (
    <div className="max-w-3xl space-y-10">
      <Skeleton className="h-4 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-1.5 w-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
}
