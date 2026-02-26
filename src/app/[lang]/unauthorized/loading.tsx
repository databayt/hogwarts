// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-10 w-48" />
        <Skeleton className="mx-auto h-6 w-64" />
        <Skeleton className="mx-auto h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}
