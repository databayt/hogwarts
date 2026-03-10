// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-w-[280px] flex-col gap-6 md:min-w-[350px]">
      <Card className="bg-background border-none shadow-none">
        <CardHeader className="text-center" />
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
