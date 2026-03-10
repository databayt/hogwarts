// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-w-[280px] flex-col gap-6 md:min-w-[350px]">
      <Card className="bg-background border-none shadow-none">
        <CardHeader className="text-center">
          <Skeleton className="mx-auto h-6 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex w-full items-center justify-center">
              <Skeleton className="h-8 w-24" />
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
