// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-[200px]" />
        <Skeleton className="h-9 w-[300px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-4 w-1/2" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
