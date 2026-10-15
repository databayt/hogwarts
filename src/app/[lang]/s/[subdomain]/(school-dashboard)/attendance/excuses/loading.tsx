// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="max-w-3xl space-y-5">
      <Skeleton className="h-8 w-56 rounded-full" />
      <Skeleton className="h-8 w-64 rounded-full" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}
