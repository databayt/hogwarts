// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import { Shell as PageContainer } from "@/components/table/shell"

export default function Loading() {
  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="mt-6 h-[400px] rounded-lg" />
    </PageContainer>
  )
}
